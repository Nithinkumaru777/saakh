// A CSS fade, not a JS one: server HTML rendered at opacity 0 stays invisible until React has hydrated.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex-1 route-fade">{children}</div>;
}
