import InstrumentClient from "./InstrumentClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InstrumentPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const decoded = decodeURIComponent(symbol);

  return <InstrumentClient symbol={decoded} />;
}
