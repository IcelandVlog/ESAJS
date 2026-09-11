export default function SiteFooter() {
  return (
    <footer className="bg-pine-dark text-paper/70 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 text-sm flex flex-col sm:flex-row gap-2 sm:justify-between">
        <p>© {new Date().getFullYear()} উদয়ন উচ্চ বিদ্যালয়। সর্বস্বত্ব সংরক্ষিত।</p>
        <p>ঢাকা, বাংলাদেশ</p>
      </div>
    </footer>
  );
}
