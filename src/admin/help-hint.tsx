import { IconInfo } from "../shared/mono-icons";

type HelpHintProps = {
  text: string;
};

export function HelpHint({ text }: HelpHintProps) {
  return (
    <span className="help-hint" tabIndex={0} aria-label={text}>
      <IconInfo className="icon-svg icon-svg--sm" />
      <span className="help-hint-popup">{text}</span>
    </span>
  );
}
