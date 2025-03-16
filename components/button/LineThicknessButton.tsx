import { SVGProps } from "react";

export function LineThicknessButton(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M2.75 4.5h18.5M20.5 10h-17a.75.75 0 0 0 0 1.5h17a.75.75 0 0 0 0-1.5"></path>
        <path
          fill="currentColor"
          d="M19.75 17H4.25a1.5 1.5 0 0 0 0 3h15.5a1.5 1.5 0 0 0 0-3"
        ></path>
      </g>
    </svg>
  );
}
