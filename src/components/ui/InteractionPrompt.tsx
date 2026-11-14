interface PromptProps {
  actionText: string | null;
  stationTitle?: string | null;
}

export function InteractionPrompt({ actionText, stationTitle }: PromptProps) {
  if (!actionText) return null;

  return (
    <div className="nasa-interaction-prompt">
      <div className="nasa-prompt-pill">
        <span className="nasa-key-badge">E</span>
        <div className="nasa-prompt-text-column">
          <span className="nasa-prompt-action">{actionText}</span>
          {stationTitle && (
            <span className="nasa-prompt-station">{stationTitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

