import { FeatureSection } from "./feature-section";
import { PROMPT_STEPS } from "@/lib/content";
import styles from "./prompt-flow.module.css";

/**
 * Every prompt the CLI asks, in order, with the flag that answers it and why
 * the question exists. Nothing in the flow is left undocumented.
 */
export function PromptFlow() {
  return (
    <FeatureSection
      id="flow"
      eyebrow="The interactive flow"
      title="Seven questions, and a flag for every one"
      lead="Press enter through the whole thing and you get a considered default. Answer them and you get your project. Pass flags and it runs unattended."
      tinted
    >
      <ol className={styles.steps}>
        {PROMPT_STEPS.map((step, index) => (
          <li key={step.id} className={styles.step} data-conditional={step.conditional ? "true" : undefined}>
            <div className={styles.marker} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className={styles.content}>
              <h3 className={styles.question}>
                {step.question}
                {step.conditional && <span className={styles.conditional}>{step.conditional}</span>}
              </h3>

              <ul className={styles.choices}>
                {step.choices.map((choice) => (
                  <li key={choice.label} data-default={choice.isDefault ? "true" : undefined}>
                    <span className={styles.choiceLabel}>{choice.label}</span>
                    {choice.hint && <span className={styles.choiceHint}>{choice.hint}</span>}
                  </li>
                ))}
              </ul>

              <p className={styles.why}>{step.why}</p>

              <code className={styles.flag}>{step.flag}</code>
            </div>
          </li>
        ))}
      </ol>
    </FeatureSection>
  );
}
