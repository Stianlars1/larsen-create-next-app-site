import { Hero } from "@/components/site/hero";
import { Footer } from "@/components/site/footer";
import { Manifest } from "@/components/site/manifest";
import { PromptFlow } from "@/components/features/prompt-flow";
import { CommandBuilder } from "@/components/features/command-builder";
import { DocsScroll } from "@/components/surfaces/docs-scroll";
import {
  CliSection,
  ColourSection,
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
        {/* Renders its own <section> and pins itself, so it takes no wrapper */}
        <DocsScroll />
        <SkillsSection />
        <CliSection />
        {/* After the flag table, because assembling a command needs all of it */}
        <CommandBuilder />
        <TreeSection />
      </main>
      <Footer />
    </>
  );
}
