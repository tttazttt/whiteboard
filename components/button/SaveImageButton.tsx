import { SVGProps } from "react";

export function SaveImageButton(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M14.5 23.5v-1h7v1zm3.5-3.212L14.712 17l.688-.688l2.1 2.1v-4.887h1v4.887l2.1-2.1l.688.688zM4.5 19.5v-17H13L18.5 8v3.14h-6.384v8.36zm8-11h5l-5-5z"
      ></path>
    </svg>
  );
}
