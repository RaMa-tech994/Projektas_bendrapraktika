export const USERS_API = 'https://testapi.io/api/evelinapal/resource/users';

export type ApiUser = {
  id: string | number;
  username: string;
  password: string;
  user_metadata?: { username: string };
  email?: string;
};

type ApiResponse = ApiUser[] | { data?: ApiUser[]; users?: ApiUser[]; username?: string; password?: string; id?: string | number };

function extractUsers(payload: ApiResponse): ApiUser[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  return payload.id !== undefined && payload.username && payload.password ? [payload as ApiUser] : [];
}

async function readResponse(response: Response) {
  const text = await response.text();
  let payload: ApiResponse | null = null;
  try { payload = text ? JSON.parse(text) as ApiResponse : null; } catch { /* handled below */ }
  if (!response.ok) {
    const detail = payload && !Array.isArray(payload) && 'message' in payload ? String(payload.message) : '';
    throw new Error(detail || `API klaida (${response.status}).`);
  }
  return payload;
}

export async function updateUser(id: string | number, changes: { username?: string; password?: string }): Promise<ApiUser> {
  const response = await fetch(`${USERS_API}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(changes),
  });
  const payload = await readResponse(response);
  const updated = payload ? extractUsers(payload)[0] : undefined;
  if (updated?.id !== undefined) return { ...updated, user_metadata: { username: updated.username } };
  const users = await getUsers();
  const found = users.find(user => String(user.id) === String(id));
  if (!found) throw new Error('Įrašas atnaujintas, bet API negrąžino naudotojo duomenų.');
  return { ...found, user_metadata: { username: found.username } };
}

export async function deleteUser(id: string | number): Promise<void> {
  const response = await fetch(`${USERS_API}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  await readResponse(response);
}

export async function registerUser(username: string, password: string): Promise<ApiUser> {
  const response = await fetch(USERS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const payload = await readResponse(response);
  const created = payload ? extractUsers(payload)[0] : undefined;
  if (created?.id !== undefined) return { ...created, user_metadata: { username: created.username } };

  // Some resource APIs return an empty body after creation; look up the new record by username.
  const users = await getUsers();
  const found = users.find(user => user.username.toLowerCase() === username.toLowerCase());
  if (!found) throw new Error('Paskyra sukurta, bet API negrąžino jos ID.');
  return { ...found, user_metadata: { username: found.username } };
}

export async function getUsers(): Promise<ApiUser[]> {
  const response = await fetch(USERS_API, { headers: { Accept: 'application/json' } });
  const payload = await readResponse(response);
  if (!payload) return [];
  const users = extractUsers(payload);
  if (!users.length && !Array.isArray(payload)) throw new Error('API grąžino neatpažįstamą naudotojų formatą.');
  return users;
}

export async function signInUser(username: string, password: string): Promise<ApiUser> {
  const users = await getUsers();
  const user = users.find(item => item.username.toLowerCase() === username.toLowerCase() && item.password === password);
  if (!user) throw new Error('Neteisingas vartotojo vardas arba slaptažodis.');
  return { ...user, user_metadata: { username: user.username } };
}
