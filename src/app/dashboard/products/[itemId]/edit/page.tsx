import EditProductClient from "./EditProductClient";

type PageProps = {
  params: Promise<{ itemId: string }>;
};

export default function Page(props: PageProps) {
  // Server component: just forward params to the client component
  return <EditProductClient params={props.params} />;
}
