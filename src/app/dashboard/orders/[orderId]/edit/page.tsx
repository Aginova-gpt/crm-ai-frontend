import EditOrderClient from "./EditOrderClient";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default function Page(props: PageProps) {
  return <EditOrderClient params={props.params} />;
}

