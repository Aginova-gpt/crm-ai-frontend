import ClientPage from "../ClientPage";

export default function Page({ params }: { params: { id: string } }) {
  return <ClientPage customerId={params.id} />;
}
