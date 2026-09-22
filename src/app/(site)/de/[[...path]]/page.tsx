import {
  localizedPage,
  localizedMetadata,
  localizedStaticParams,
} from "../../../../seo/route-pages";
export const dynamicParams = false;
export const generateStaticParams = localizedStaticParams;
type Props = { params: Promise<{ path?: string[] }> };
export async function generateMetadata({ params }: Props) {
  return localizedMetadata("de", (await params).path);
}
export default async function Page({ params }: Props) {
  return localizedPage("de", (await params).path);
}
