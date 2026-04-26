export type FirebasePasswordLoginResponse = {
  email: string;
  idToken: string;
  localId: string;
};

export async function signInWithPassword(email: string, password: string) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: FIREBASE_WEB_API_KEY");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as FirebasePasswordLoginResponse;
}
