export default function ResultsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
