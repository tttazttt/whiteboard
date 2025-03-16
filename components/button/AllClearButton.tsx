import { SVGProps } from "react";

export function AllClearButton(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 0c2.12 0 4.16.843 5.66 2.34C15.16 3.84 16 5.88 16 8a8.02 8.02 0 0 1-2.34 5.66A8 8 0 0 1 8 16a8.02 8.02 0 0 1-5.66-2.34A8 8 0 0 1 0 8c0-2.12.843-4.16 2.34-5.66C3.84.84 5.88 0 8 0m0 1a7.001 7.001 0 1 0 .002 14A7.001 7.001 0 0 0 8 1M5.15 5.15a.5.5 0 0 1 .354-.147a.5.5 0 0 1 .354.147l2.15 2.15l2.15-2.15a.501.501 0 0 1 .815.545a.5.5 0 0 1-.11.162l-2.15 2.15l2.15 2.15a.497.497 0 0 1-.005.701a.503.503 0 0 1-.701.006l-2.15-2.15l-2.14 2.15a.5.5 0 0 1-.71-.707l2.15-2.15l-2.15-2.15a.5.5 0 0 1-.146-.354a.5.5 0 0 1 .147-.354z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}
