import { PROMPT_STEPS, type PromptStep } from "@/lib/content";
import styles from "./prompt-flow.module.css";

/**
 * Every prompt the CLI asks, with the flag that answers it. Seven questions,
 * plus three follow-ups that only appear if you ask for a custom palette -
 * shown nested rather than numbered, because that is how the flow behaves.
 */
export function PromptFlow() {
  return (
    <section className="section" id="flow">
      <div className="page">
        <p className="label">The flow</p>
        <h2 className="headline">Seven questions. Every one has a flag.</h2>
        <p className="lead">
          Press enter through all of them for a considered default, or pass flags and skip the
          terminal entirely.
        </p>

        <ol className={styles.steps}>
          {PROMPT_STEPS.map((step, index) => (
            <li key={step.id}>
              <Step step={step} index={index + 1} />
              {step.followUps && (
                <ul className={styles.followUps}>
                  {step.followUps.map((followUp) => (
                    <li key={followUp.id}>
                      <Step step={followUp} nested />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({ step, index, nested }: { step: PromptStep; index?: number; nested?: boolean }) {
  return (
    <article className={styles.step} data-nested={nested ? "true" : undefined}>
      <div className={styles.marker} aria-hidden="true">
        {nested ? "└" : String(index).padStart(2, "0")}
      </div>

      <div className={styles.content}>
        <h3 className={styles.question}>{step.question}</h3>

        <ul className={styles.choices}>
          {step.choices.map((choice) => (
            <li key={choice.label} data-default={choice.isDefault ? "true" : undefined}>
              {choice.label}
              {choice.hint && <em>{choice.hint}</em>}
            </li>
          ))}
        </ul>

        <p className={styles.why}>{step.why}</p>
      </div>

      <code className={styles.flag}>{step.flag}</code>
    </article>
  );
}
