"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "./blog-detail.css";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    if (slug) {
      fetchBlog();
      fetchRelatedBlogs();
    }
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    const res = await fetch(`/api/blog/${slug}`);
    if (res.ok) {
      const data = await res.json();
      setBlog(data);
    }
    setLoading(false);
  };

  const fetchRelatedBlogs = async () => {
    const res = await fetch("/api/blog?limit=4");
    if (res.ok) {
      const data = await res.json();
      setRelatedBlogs(data.filter(b => b.slug !== slug).slice(0, 3));
    }
  };

  if (loading) return <div className="blog-loader">Loading blog...</div>;
  if (!blog) return <div className="blog-not-found">Blog not found</div>;

  return (
    <div className="blog-wrapper">
      <article className="blog-card">

        {/* Feature Image */}
        {blog.image && (
          <div className="blog-image">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              priority
            />
            {blog.featured && <span className="badge">⭐ Featured</span>}
          </div>
        )}

        <div className="blog-content">

          {/* Meta */}
          <div className="blog-meta">
            {blog.category && <span className="tag">{blog.category}</span>}
            {blog.featured && <span className="tag blue">Featured</span>}
          </div>

          <h1 className="blog-title">{blog.title}</h1>

          <div className="blog-info">
            <span>By {blog.author}</span>
            <span>•</span>
            <span>{new Date(blog.createdAt).toDateString()}</span>
            {blog.views > 0 && <span>• 👁️ {blog.views}</span>}
          </div>

          {/* Content */}
          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags?.length > 0 && (
            <div className="blog-tags">
              {blog.tags.map((tag, i) => (
                <span key={i}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Back */}
          <Link href="/blog" className="back-btn">
            ← Back to Blogs
          </Link>
        </div>
      </article>

      {/* Related Blogs */}
      {relatedBlogs.length > 0 && (
        <section className="related-section">
          <h2>Related Blogs</h2>

          <div className="related-grid">
            {relatedBlogs.map(rb => (
              <Link key={rb._id} href={`/blog/${rb.slug}`} className="related-card">
                {rb.image && (
                  <div className="related-image">
                    <Image src={rb.image} alt={rb.title} fill />
                  </div>
                )}
                <div className="related-content">
                  <h3>{rb.title}</h3>
                  <p>{rb.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
