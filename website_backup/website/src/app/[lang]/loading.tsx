import Logo from '@/components/Logo';

export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="h-32 w-32 animate-[spin_3s_linear_infinite]">
        <Logo />
      </div>
    </div>
  );
}