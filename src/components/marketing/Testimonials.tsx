"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating?: number;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  title?: string;
  description?: string;
}

export function Testimonials({
  testimonials,
  title = "What Our Customers Say",
  description,
}: TestimonialsProps) {
  return (
    <section className="py-20" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {title}
          </h2>
          {description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative shadow-elegant hover:shadow-soft transition-shadow">
              <CardContent className="p-8">
                <Quote
                  className="w-10 h-10 text-primary/20 mb-4"
                  aria-hidden="true"
                />

                {testimonial.rating && (
                  <div className="flex gap-1 mb-4" aria-label={`Rating: ${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}

                <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                <div className="border-t pt-4">
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
