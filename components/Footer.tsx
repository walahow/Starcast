'use client';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="text-2xl font-bold tracking-tighter mb-6">
              STARCAST
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Curated 1:64 scale diecast collectibles for passionate enthusiasts worldwide.
            </p>
            <a
              href="https://www.instagram.com/starcast.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-4 transition-all"
            >
              Follow Us
              <span>→</span>
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground mb-6">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#showcase"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Collection
                </a>
              </li>
              <li>
                <a
                  href="#how-to"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground mb-6">Information</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground mb-6">Connect</h4>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Located in Indonesia
              </p>
              <p className="text-sm text-primary font-semibold">
                starcast.id
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>&copy; 2026 Starcast. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
