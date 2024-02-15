const Document = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="14"
    viewBox="0 0 12 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11.06 5.2399H7.98C7.254 5.2399 6.66 4.6459 6.66 3.9199V0.839902C6.66 0.597902 6.462 0.399902 6.22 0.399902H1.82C1.094 0.399902 0.5 0.993902 0.5 1.7199V12.2799C0.5 13.0059 1.094 13.5999 1.82 13.5999H10.18C10.906 13.5999 11.5 13.0059 11.5 12.2799V5.6799C11.5 5.4379 11.302 5.2399 11.06 5.2399ZM11.412 3.3919L8.508 0.487902C8.442 0.421902 8.376 0.399902 8.288 0.399902C8.112 0.399902 7.98 0.531902 7.98 0.707902V3.0399C7.98 3.5239 8.376 3.9199 8.86 3.9199H11.192C11.368 3.9199 11.5 3.7879 11.5 3.6119C11.5 3.5239 11.478 3.4579 11.412 3.3919Z"
      fill="black"
    />
  </svg>
);

const Alert = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const Plus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.25127 1.24994C9.25127 0.559616 8.69165 0 8.00133 0C7.31101 0 6.75139 0.559616 6.75139 1.24994V6.75042H1.24994C0.559616 6.75042 0 7.31003 0 8.00035C0 8.69068 0.559616 9.25029 1.24994 9.25029H6.75139V14.7501C6.75139 15.4404 7.31101 16 8.00133 16C8.69165 16 9.25127 15.4404 9.25127 14.7501V9.25029H14.7501C15.4404 9.25029 16 8.69068 16 8.00035C16 7.31003 15.4404 6.75042 14.7501 6.75042H9.25127V1.24994Z"
      fill="black"
    />
  </svg>
);

import refresh from "../assets/refresh.png";

const Refresh = () => <img alt="" src={refresh} height={16} />;

const Octagon = ({
  color,
  ...props
}: {
  color?: string;
} & React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 7L4 0.0717964H12L16 7L12 13.9282H4L0 7Z" fill={color} />
    </svg>
  );
};

const Diamond = ({
  color,
  ...props
}: {
  color?: string;
} & React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 8L8 0L16 8L8 16L0 8Z" fill={color} />
    </svg>
  );
};

export const Icons = {
  Document,
  Alert,
  Plus,
  Refresh,
  Octagon,
  Diamond,
};
