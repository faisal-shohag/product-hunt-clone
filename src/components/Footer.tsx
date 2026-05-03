import { Link } from 'react-router-dom'
import { Rocket, GitFork as Github, Battery as Twitter, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity w-fit">
              <Rocket className="size-5 text-primary" />
              <span>LaunchPad</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Discover and launch innovative products with our community.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
                <Github className="size-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" title="Twitter">
                <Twitter className="size-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" title="Email">
                <Mail className="size-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
                  Submit
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Collections
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trending
                </a>
              </li>
            </ul>
          </div>

          {/* Makers */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">For Makers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/become-maker" className="text-muted-foreground hover:text-foreground transition-colors">
                  Become a Maker
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} LaunchPad. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-foreground transition-colors">Status</a>
            <a href="#" className="hover:text-foreground transition-colors">API</a>
            <a href="#" className="hover:text-foreground transition-colors">Blog</a>
            <a href="#" className="hover:text-foreground transition-colors">Careers</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
