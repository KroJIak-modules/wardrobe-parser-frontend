import type { ButtonHTMLAttributes } from "react";
import { IconClose } from "./mono-icons";

type TagRemoveButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function TagRemoveButton(props: TagRemoveButtonProps) {
  return (
    <button type="button" className="tag-x" {...props}>
      <IconClose className="icon-svg icon-svg--sm" />
    </button>
  );
}
