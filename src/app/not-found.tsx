import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="mb-4 text-6xl">404</CardTitle>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The page you&apos;re looking for doesn&apos;t exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">Go home</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/sales-input">Start recording sales</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
