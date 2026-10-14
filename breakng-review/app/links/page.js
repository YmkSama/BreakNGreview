import LinkPage from "@/components/links/LinkPage";
import { getConfig } from "@/lib/links/store";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const c = await getConfig();
  return { title: c.brand.name, description: c.brand.bio };
}

export default async function Home() {
  const config = await getConfig();
  return <LinkPage config={config} />;
}
