"use client"
export default function HomePage() {
  console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
  return <h1>Welcome to Sentinel Next!</h1>;
}
