import {
  LocalizedRoot,
  siteRootMetadata,
  siteViewport,
} from "../../../seo/root";
export const metadata = siteRootMetadata;
export const viewport = siteViewport;
export default function Layout({ children }: { children: React.ReactNode }) {
  return <LocalizedRoot locale="en">{children}</LocalizedRoot>;
}
