export const metadata = {
  title: 'Ferrari Pit Strategy Simulator',
  description: 'Interactive F1 strategy game for Leclerc and Hamilton',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}