"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactInquiry, Product, ProductImage, ProductReview, ProductUseCase } from "@/types/product";
import { DEFAULT_PRODUCT_IMAGE, DEFAULT_USE_CASE_IMAGE, galleryImagePath, productCoverPath, useCaseImagePath } from "@/lib/assets";
import { makeId, slugify, sortByOrder } from "@/lib/security";
import { ContactActions } from "@/components/ContactActions";
import { FallbackImage } from "@/components/FallbackImage";
import { RatingStars } from "@/components/RatingStars";
import { ToastContainer } from "@/components/admin/ToastContainer";
import { useToast } from "@/hooks/useToast";

type AdminDashboardProps = {
  initialProducts: Product[];
  inquiries: ContactInquiry[];
};

function specsToText(specifications: Record<string, string>) {
  return Object.entries(specifications)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function textToSpecs(value: string) {
  return value.split("\n").reduce<Record<string, string>>((specs, line) => {
    const [key, ...rest] = line.split(":");
    const cleanKey = key?.trim();
    const cleanValue = rest.join(":").trim();
    if (cleanKey && cleanValue) {
      specs[cleanKey] = cleanValue;
    }

    return specs;
  }, {});
}

function reorder<T extends { order: number }>(items: T[], index: number, direction: -1 | 1) {
  const next = [...items];
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= next.length) {
    return items;
  }

  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next.map((entry, orderIndex) => ({ ...entry, order: orderIndex + 1 }));
}

/** Deep-compare two product objects to detect unsaved edits */
function hasChanges(a: Product | null, b: Product | null): boolean {
  if (a === b) return false;
  if (!a || !b) return false;
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function AdminDashboard({ initialProducts, inquiries }: AdminDashboardProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [selected, setSelected] = useState<Product | null>(initialProducts[0] ?? null);
  const [pending, setPending] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  // Track the "clean" version of the selected product (last saved state)
  const cleanSelectedRef = useRef<Product | null>(initialProducts[0] ?? null);

  const isDirty = useMemo(() => hasChanges(selected, cleanSelectedRef.current), [selected]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const approvedReviews = useMemo(
    () => products.flatMap((product) => product.reviews.filter((review) => review.approved)),
    [products]
  );

  const pendingReviews = useMemo(
    () => products.flatMap((product) => product.reviews.filter((review) => !review.approved)),
    [products]
  );

  const featuredCount = useMemo(() => products.filter((product) => product.featured).length, [products]);

  const avgRating = useMemo(() => {
    const rated = products.filter((product) => product.rating > 0);
    if (rated.length === 0) return 0;
    return Number((rated.reduce((sum, product) => sum + product.rating, 0) / rated.length).toFixed(1));
  }, [products]);

  const totalImages = useMemo(
    () => products.reduce((sum, product) => sum + product.galleryImages.length, 0),
    [products]
  );

  function syncProduct(product: Product) {
    setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
    setSelected(product);
    cleanSelectedRef.current = product;
  }

  /** Confirm discard if there are unsaved changes, returns true if safe to proceed */
  const confirmDiscard = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }, [isDirty]);

  /** Safe product switch — warns about unsaved changes */
  function selectProduct(product: Product) {
    if (selected?.id === product.id) return;
    if (!confirmDiscard()) return;
    setSelected(product);
    cleanSelectedRef.current = product;
    setReviewsExpanded(false);
  }

  /** Safe close — warns about unsaved changes */
  function closeEditor() {
    if (!confirmDiscard()) return;
    setSelected(null);
    cleanSelectedRef.current = null;
    setReviewsExpanded(false);
  }

  async function saveProduct(product = selected) {
    if (!product) {
      return;
    }

    setPending(true);
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    });
    const result = (await response.json()) as { product?: Product; message?: string };
    setPending(false);

    if (response.ok && result.product) {
      syncProduct(result.product);
      showToast("Changes saved successfully!", "success");
      router.refresh();
      return;
    }

    showToast(result.message ?? "Could not save product.", "error");
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const slug = slugify(formData.get("slug") || name);

    setPending(true);
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        slug,
        description: formData.get("description"),
        specifications: {
          "Shelf Life": "6 Months",
          "Spice Level": "Medium"
        },
        coverImage: "",
        galleryImages: [],
        useCases: [],
        reviews: [],
        visible: true,
        featured: false,
        badge: "New"
      })
    });
    const result = (await response.json()) as { product?: Product; message?: string };
    setPending(false);

    if (response.ok && result.product) {
      setProducts((current) => [...current, result.product as Product]);
      setSelected(result.product);
      cleanSelectedRef.current = result.product;
      showToast("Product added successfully!", "success");
      form.reset();
      router.refresh();
      return;
    }

    showToast(result.message ?? "Could not add product.", "error");
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`Delete ${product.name}? This removes it from the product data.`);
    if (!confirmed) {
      return;
    }

    setPending(true);
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const result = (await response.json()) as { message?: string };
    setPending(false);

    if (response.ok) {
      const nextProducts = products.filter((item) => item.id !== product.id);
      setProducts(nextProducts);
      const next = nextProducts[0] ?? null;
      setSelected(next);
      cleanSelectedRef.current = next;
      showToast("Product deleted.", "success");
      router.refresh();
      return;
    }

    showToast(result.message ?? "Could not delete product.", "error");
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>, kind: "gallery" | "cover" | "useCase") {
    event.preventDefault();
    if (!selected) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("kind", kind);
    setPending(true);
    const response = await fetch(`/api/admin/products/${selected.id}/images`, {
      method: "POST",
      body: formData
    });
    const result = (await response.json()) as { product?: Product; message?: string };
    setPending(false);

    if (response.ok && result.product) {
      syncProduct(result.product);
      showToast("Image uploaded!", "success");
      form.reset();
      router.refresh();
      return;
    }

    showToast(result.message ?? "Could not upload image.", "error");
  }

  async function deleteImage(imageType: "gallery" | "useCase", imageId: string) {
    if (!selected) {
      return;
    }

    setPending(true);
    const response = await fetch(`/api/admin/products/${selected.id}/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageType, imageId })
    });
    const result = (await response.json()) as { product?: Product; message?: string };
    setPending(false);

    if (response.ok && result.product) {
      syncProduct(result.product);
      showToast("Image removed.", "success");
      router.refresh();
      return;
    }

    showToast(result.message ?? "Could not remove image.", "error");
  }

  async function logout() {
    if (!confirmDiscard()) return;
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function updateSelected(next: Product) {
    setSelected(next);
  }

  function updateReview(review: ProductReview) {
    if (!selected) {
      return;
    }

    updateSelected({
      ...selected,
      reviews: selected.reviews.map((item) => (item.id === review.id ? review : item))
    });
  }

  function updateUseCase(useCase: ProductUseCase) {
    if (!selected) {
      return;
    }

    updateSelected({
      ...selected,
      useCases: selected.useCases.map((item) => (item.id === useCase.id ? useCase : item))
    });
  }

  return (
    <div className="admin-page">
      <div className="top-header">
        <button className="icon-button" type="button" aria-label="Menu">
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
        </button>
        <span className="brand-name">व्यंजन द्रव्यणी</span>
        <button className="icon-button" type="button" onClick={logout} aria-label="Sign out">
          <span className="material-symbols-outlined" aria-hidden="true">logout</span>
        </button>
      </div>

      <main className="container admin-shell">
          <div className="card admin-card">
            <div className="admin-toolbar">
              <div>
                <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", margin: 0 }}>Dashboard Overview</h1>
                <p className="muted" style={{ marginTop: 4 }}>Manage your storefront.</p>
              </div>
            </div>

            <div className="grid admin-stats" style={{ marginTop: 18 }}>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">inventory_2</span></span>
                <p className="muted">Total Products</p>
                <h3>{products.length}</h3>
              </div>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">rate_review</span></span>
                <p className="muted">Approved Reviews</p>
                <h3>{approvedReviews.length}</h3>
              </div>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">pending_actions</span></span>
                <p className="muted">Pending Reviews</p>
                <h3>{pendingReviews.length}</h3>
              </div>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">mail</span></span>
                <p className="muted">New Inquiries</p>
                <h3>{inquiries.length}</h3>
              </div>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">star</span></span>
                <p className="muted">Avg Rating</p>
                <h3>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</h3>
              </div>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">featured_play_list</span></span>
                <p className="muted">Featured</p>
                <h3>{featuredCount}</h3>
              </div>
              <div className="admin-stat-card">
                <span className="feature-icon"><span className="material-symbols-outlined">photo_library</span></span>
                <p className="muted">Gallery Images</p>
                <h3>{totalImages}</h3>
              </div>
            </div>
          </div>

          <div className="admin-split-grid">
            <aside className="admin-editor">
              <form className="card admin-card form-grid" onSubmit={createProduct}>
                <h2 style={{ fontSize: "1.35rem", margin: 0 }}>Add Product</h2>
                <div className="field">
                  <label htmlFor="new-product-name">Name</label>
                  <input id="new-product-name" name="name" required maxLength={120} />
                </div>
                <div className="field">
                  <label htmlFor="new-product-slug">Slug</label>
                  <input id="new-product-slug" name="slug" placeholder="auto from name" maxLength={80} />
                </div>
                <div className="field">
                  <label htmlFor="new-product-description">Short Description</label>
                  <textarea id="new-product-description" name="description" maxLength={500} required />
                </div>
                <button className="button primary" type="submit" disabled={pending}>
                  <span className="material-symbols-outlined" aria-hidden="true">add</span>
                  New Product
                </button>
              </form>

              <div className="card admin-card">
                <h2 style={{ fontSize: "1.35rem", marginBottom: 12 }}>Product Inventory</h2>
                <div className="admin-list">
                  {products.map((product) => (
                    <button
                      className="admin-list-item"
                      key={product.id}
                      type="button"
                      aria-current={selected?.id === product.id ? "true" : "false"}
                      onClick={() => selectProduct(product)}
                    >
                      <span className="admin-list-thumb">
                        <FallbackImage
                          src={productCoverPath(product)}
                          fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                          alt=""
                          width={90}
                          height={90}
                        />
                      </span>
                      <span>
                        <strong>{product.name}</strong>
                        <small className="muted" style={{ display: "block" }}>
                          {product.visible ? "Visible" : "Hidden"} · {product.rating.toFixed(1)} rating
                        </small>
                      </span>
                      <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="admin-editor">
          {selected ? (
            <>
              <div className="card admin-card">
                <div className="admin-toolbar">
                  <div>
                    <span className="eyebrow">Editing</span>
                    <h2 style={{ marginTop: 10 }}>{selected.name}</h2>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="button secondary" type="button" onClick={closeEditor}>
                      <span className="material-symbols-outlined" aria-hidden="true">close</span>
                      Close
                    </button>
                    <button className="button danger" type="button" onClick={() => deleteProduct(selected)} disabled={pending}>
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="admin-two" style={{ marginTop: 18 }}>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="product-name">Name</label>
                      <input
                        id="product-name"
                        value={selected.name}
                        onChange={(event) => updateSelected({ ...selected, name: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="product-slug">Slug</label>
                      <input
                        id="product-slug"
                        value={selected.slug}
                        onChange={(event) => updateSelected({ ...selected, slug: slugify(event.target.value) })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="product-badge">Badge</label>
                      <input
                        id="product-badge"
                        value={selected.badge ?? ""}
                        onChange={(event) => updateSelected({ ...selected, badge: event.target.value })}
                      />
                    </div>
                    <div className="switch-row">
                      <span>
                        <strong>Visible</strong>
                        <small className="muted" style={{ display: "block" }}>Show product publicly</small>
                      </span>
                      <button
                        className="switch"
                        type="button"
                        role="switch"
                        aria-checked={selected.visible}
                        onClick={() => updateSelected({ ...selected, visible: !selected.visible })}
                      >
                        <span />
                      </button>
                    </div>
                    <div className="switch-row">
                      <span>
                        <strong>Featured</strong>
                        <small className="muted" style={{ display: "block" }}>Show on homepage</small>
                      </span>
                      <button
                        className="switch"
                        type="button"
                        role="switch"
                        aria-checked={selected.featured}
                        onClick={() => updateSelected({ ...selected, featured: !selected.featured })}
                      >
                        <span />
                      </button>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="product-description">Description</label>
                      <textarea
                        id="product-description"
                        value={selected.description}
                        onChange={(event) => updateSelected({ ...selected, description: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="product-specifications">Specifications</label>
                      <textarea
                        id="product-specifications"
                        value={specsToText(selected.specifications)}
                        onChange={(event) =>
                          updateSelected({ ...selected, specifications: textToSpecs(event.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ── Universal sticky save bar ── */}
                {isDirty && (
                  <div className="admin-sticky-save">
                    <span className="unsaved-badge">
                      <span className="material-symbols-outlined">edit_note</span>
                      Unsaved changes
                    </span>
                    <button className="button primary" type="button" onClick={() => saveProduct()} disabled={pending}>
                      <span className="material-symbols-outlined" aria-hidden="true">save</span>
                      {pending ? "Saving…" : "Save All Changes"}
                    </button>
                  </div>
                )}
              </div>

              <div className="card admin-card">
                <h2>Product Images</h2>
                <div className="admin-two" style={{ marginTop: 14 }}>
                  <form className="form-grid" onSubmit={(event) => uploadImage(event, "cover")}>
                    <h3 style={{ fontSize: "1.2rem" }}>Upload Cover</h3>
                    <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
                    <div className="field">
                      <label htmlFor="cover-alt">Alt Text</label>
                      <input id="cover-alt" name="alt" defaultValue={`${selected.name} product photo`} />
                    </div>
                    <button className="button secondary" type="submit" disabled={pending}>Upload Cover</button>
                  </form>
                  <form className="form-grid" onSubmit={(event) => uploadImage(event, "gallery")}>
                    <h3 style={{ fontSize: "1.2rem" }}>Upload Gallery Image</h3>
                    <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
                    <div className="field">
                      <label htmlFor="gallery-alt">Alt Text</label>
                      <input id="gallery-alt" name="alt" defaultValue={`${selected.name} detail photo`} />
                    </div>
                    <button className="button secondary" type="submit" disabled={pending}>Upload Image</button>
                  </form>
                </div>
                <div className="admin-image-grid" style={{ marginTop: 16 }}>
                  {sortByOrder(selected.galleryImages).map((image, index) => (
                    <div className="admin-image-tile" key={image.id}>
                      <FallbackImage
                        src={galleryImagePath(selected, image)}
                        fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                        alt={image.alt}
                        width={260}
                        height={260}
                      />
                      <div className="tile-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Move image up"
                          onClick={() =>
                            updateSelected({
                              ...selected,
                              galleryImages: reorder(selected.galleryImages, index, -1) as ProductImage[]
                            })
                          }
                        >
                          <span className="material-symbols-outlined">arrow_upward</span>
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Move image down"
                          onClick={() =>
                            updateSelected({
                              ...selected,
                              galleryImages: reorder(selected.galleryImages, index, 1) as ProductImage[]
                            })
                          }
                        >
                          <span className="material-symbols-outlined">arrow_downward</span>
                        </button>
                        <button className="icon-button" type="button" aria-label="Delete image" onClick={() => deleteImage("gallery", image.id)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card admin-card">
                <h2>How To Use</h2>
                <form className="form-grid" onSubmit={(event) => uploadImage(event, "useCase")} style={{ marginTop: 14 }}>
                  <div className="admin-two">
                    <div className="field">
                      <label htmlFor="use-title">Use Case Title</label>
                      <input id="use-title" name="title" placeholder="Amti" required />
                    </div>
                    <div className="field">
                      <label htmlFor="use-caption">Caption</label>
                      <input id="use-caption" name="caption" placeholder="Elevate daily dal" required />
                    </div>
                  </div>
                  <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
                  <button className="button secondary" type="submit" disabled={pending}>
                    <span className="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
                    Add Use Case Image
                  </button>
                </form>
                <div className="admin-editor" style={{ marginTop: 16 }}>
                  {sortByOrder(selected.useCases).map((useCase, index) => (
                    <div className="admin-panel" key={useCase.id}>
                      <div className="admin-two">
                        <FallbackImage
                          src={useCaseImagePath(selected, useCase)}
                          fallbackSrc={DEFAULT_USE_CASE_IMAGE}
                          alt={useCase.alt}
                          width={360}
                          height={240}
                          style={{ borderRadius: 12, width: "100%", background: "var(--surface-high)" }}
                        />
                        <div className="form-grid">
                          <div className="field">
                            <label htmlFor={`${useCase.id}-title`}>Title</label>
                            <input
                              id={`${useCase.id}-title`}
                              value={useCase.title}
                              onChange={(event) => updateUseCase({ ...useCase, title: event.target.value })}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`${useCase.id}-caption`}>Caption</label>
                            <textarea
                              id={`${useCase.id}-caption`}
                              value={useCase.caption}
                              onChange={(event) => updateUseCase({ ...useCase, caption: event.target.value })}
                            />
                          </div>
                          <div className="tile-actions">
                            <button
                              className="icon-button"
                              type="button"
                              aria-label="Move use case up"
                              onClick={() =>
                                updateSelected({
                                  ...selected,
                                  useCases: reorder(selected.useCases, index, -1) as ProductUseCase[]
                                })
                              }
                            >
                              <span className="material-symbols-outlined">arrow_upward</span>
                            </button>
                            <button
                              className="icon-button"
                              type="button"
                              aria-label="Move use case down"
                              onClick={() =>
                                updateSelected({
                                  ...selected,
                                  useCases: reorder(selected.useCases, index, 1) as ProductUseCase[]
                                })
                              }
                            >
                              <span className="material-symbols-outlined">arrow_downward</span>
                            </button>
                            <button className="icon-button" type="button" aria-label="Delete use case" onClick={() => deleteImage("useCase", useCase.id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card admin-card">
                <div className="admin-toolbar" style={{ cursor: "pointer" }} onClick={() => setReviewsExpanded(!reviewsExpanded)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 style={{ margin: 0 }}>Reviews ({selected.reviews.length})</h2>
                    <span className="material-symbols-outlined" style={{ transform: reviewsExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      expand_more
                    </span>
                  </div>
                  {reviewsExpanded && (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSelected({
                          ...selected,
                          reviews: [
                            {
                              id: makeId("rev"),
                              customerName: "",
                              rating: 5,
                              text: "",
                              approved: false,
                              createdAt: new Date().toISOString()
                            },
                            ...selected.reviews
                          ]
                        });
                      }}
                    >
                      Add Review
                    </button>
                  )}
                </div>
                {reviewsExpanded && (
                  <div className="admin-editor" style={{ marginTop: 16 }}>
                    {selected.reviews.map((review) => (
                      <div className="admin-panel" key={review.id}>
                        <div className="form-grid">
                          <div className="admin-two">
                            <div className="field">
                              <label htmlFor={`${review.id}-name`}>Customer Name</label>
                              <input
                                id={`${review.id}-name`}
                                value={review.customerName}
                                onChange={(event) => updateReview({ ...review, customerName: event.target.value })}
                              />
                            </div>
                            <div className="field">
                              <label htmlFor={`${review.id}-rating`}>Rating</label>
                              <select
                                id={`${review.id}-rating`}
                                value={review.rating}
                                onChange={(event) => updateReview({ ...review, rating: Number(event.target.value) })}
                              >
                                {[5, 4, 3, 2, 1].map((rating) => (
                                  <option key={rating} value={rating}>{rating}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <RatingStars rating={review.rating} />
                          <div className="field">
                            <label htmlFor={`${review.id}-text`}>Review Text</label>
                            <textarea
                              id={`${review.id}-text`}
                              value={review.text}
                              onChange={(event) => updateReview({ ...review, text: event.target.value })}
                            />
                          </div>
                          <div className="switch-row">
                            <span>{review.approved ? "Approved" : "Hidden"}</span>
                            <button
                              className="switch"
                              type="button"
                              role="switch"
                              aria-checked={review.approved}
                              onClick={() => updateReview({ ...review, approved: !review.approved })}
                            >
                              <span />
                            </button>
                          </div>
                          <button
                            className="button danger"
                            type="button"
                            onClick={() =>
                              updateSelected({
                                ...selected,
                                reviews: selected.reviews.filter((item) => item.id !== review.id)
                              })
                            }
                          >
                            Delete Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card admin-card">
                <h2>Contact Shortcut</h2>
                <p className="muted" style={{ marginTop: 8 }}>Use this to test the public call and WhatsApp links.</p>
                <ContactActions />
              </div>
            </>
          ) : (
            <div className="card admin-card">
              <h2>No product selected</h2>
              <p className="muted">Add a product to begin.</p>
            </div>
          )}
        </section>
      </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
