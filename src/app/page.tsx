import { Hero } from "@/components/site/hero";
import { Footer } from "@/components/site/footer";
import { BentoGrid } from "@/components/bento/bento-grid";
import { PromptFlow } from "@/components/features/prompt-flow";
import {
  CliSection,
  ColourSection,
  DocsSection,
  MotionSection,
  SkillsSection,
  TokensSection,
  TreeSection,
} from "@/components/features/sections";

export default function Page() {
  return (
    <>
      <Hero />
      <main>
        {/* At a glance */}
        <BentoGrid />

        {/* Then the same ground in depth, one section per capability */}
        <PromptFlow />
        <ColourSection />
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
