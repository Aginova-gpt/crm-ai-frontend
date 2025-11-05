import ClientPage from "../ClientPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <-- important
  return <ClientPage customerId={id} />;
}
