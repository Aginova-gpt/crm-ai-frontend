import EditQuoteClient from "./EditQuoteClient";

type PageProps = {
  params: Promise<{ quoteId: string }>;
};

export default function Page(props: PageProps) {
  return <EditQuoteClient params={props.params} />;
}

