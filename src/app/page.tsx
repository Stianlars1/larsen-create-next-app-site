import { Hero } from "@/components/site/hero";
import { Footer } from "@/components/site/footer";
import { Manifest } from "@/components/site/manifest";
import { PromptFlow } from "@/components/features/prompt-flow";
import {
  CliSection,
  ColourSection,
  DocsSection,
  MotionSection,
  SkillsSection,
  ThemeSection,
  TokensSection,
  TreeSection,
} from "@/components/features/sections";

export default function Page() {
  return (
    <>
      <Hero />
      <main>
        {/* What it replaces, stated once and plainly */}
        <Manifest />

        {/* Then each capability gets room, in the order you meet it */}
        <PromptFlow />
        <ColourSection />
        <ThemeSection />
        <TokensSection />
        <MotionSection />
        <DocsSection />
        <SkillsSection />
        <CliSection />
        <TreeSection />
      </main>
      <Footer />
    </>
  );
}
