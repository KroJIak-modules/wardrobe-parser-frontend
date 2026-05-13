import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import type { UploadPreview } from "../admin-types";

type ProductPreviewPayload = {
  title: string | null;
  vendor: string | null;
  product_type: string | null;
  price: number | null;
  currency: string | null;
};

type UseAdminProductCreateParams = {
  previewProductByUrl: (url: string) => Promise<{ ok: boolean; message: string; preview?: ProductPreviewPayload }>;
  addProductByUrl: (url: string, overrides?: {
    title?: string | null;
    vendor?: string | null;
    product_type?: string | null;
    price?: number | null;
    currency?: string | null;
    image_count?: number;
  }) => Promise<{ ok: boolean; message: string }>;
  createManualProduct: (payload: {
    title: string;
    price: number | null;
    currency: string;
    product_type: string | null;
    image_count?: number;
  }) => Promise<{ ok: boolean; message: string }>;
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  pushToast: (message: string) => void;
};

export function useAdminProductCreate(params: UseAdminProductCreateParams) {
  const { previewProductByUrl, addProductByUrl, createManualProduct, uploadProductImage, pushToast } = params;

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [productUrl, setProductUrl] = useState<string>("");
  const [productTitle, setProductTitle] = useState<string>("");
  const [productVendor, setProductVendor] = useState<string>("");
  const [productCategory, setProductCategory] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [productCurrency, setProductCurrency] = useState<string>("USD");
  const [imagePreviews, setImagePreviews] = useState<UploadPreview[]>([]);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const item of imagePreviews) {
        URL.revokeObjectURL(item.url);
      }
    };
  }, [imagePreviews]);

  const resetProductForm = () => {
    for (const item of imagePreviews) {
      URL.revokeObjectURL(item.url);
    }
    setProductUrl("");
    setProductTitle("");
    setProductVendor("");
    setProductCategory("");
    setProductPrice("");
    setProductCurrency("USD");
    setImagePreviews([]);
    setZoomedImageUrl(null);
  };

  const closeProductModal = () => {
    resetProductForm();
    setOpenModal(false);
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    const newItems = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImagePreviews((prev) => [...prev, ...newItems]);
  };

  const onDropImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith("image/"));
    addFiles(files);
  };

  const onPickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files].filter((file) => file.type.startsWith("image/")) : [];
    addFiles(files);
    event.target.value = "";
  };

  const removePreviewImage = (index: number) => {
    setImagePreviews((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const uploadSelectedImages = async () => {
    let uploadedCount = 0;
    for (const item of imagePreviews) {
      const uploadResult = await uploadProductImage(item.file);
      if (!uploadResult.ok) {
        pushToast(uploadResult.message);
        return { ok: false, count: uploadedCount };
      }
      uploadedCount += 1;
    }
    return { ok: true, count: uploadedCount };
  };

  const onFetchPreview = async () => {
    if (!productUrl.trim()) {
      pushToast("Ссылка не указана");
      return;
    }

    const result = await previewProductByUrl(productUrl.trim());
    pushToast(result.message);
    if (result.ok && result.preview) {
      setProductTitle(result.preview.title || "");
      setProductVendor(result.preview.vendor || "");
      setProductCategory(result.preview.product_type || "");
      setProductPrice(result.preview.price !== null ? String(result.preview.price) : "");
      setProductCurrency((result.preview.currency || "USD").toUpperCase());
    }
  };

  const onSaveProduct = async () => {
    if (!productTitle.trim()) {
      pushToast("Введите название товара");
      return;
    }

    const parsedPrice = productPrice.trim() ? Number(productPrice) : null;
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      pushToast("Цена должна быть числом");
      return;
    }

    const uploaded = await uploadSelectedImages();
    if (!uploaded.ok) {
      return;
    }

    const currency = (productCurrency.trim() || "USD").toUpperCase();

    const result = productUrl.trim()
      ? await addProductByUrl(productUrl.trim(), {
          title: productTitle.trim(),
          vendor: productVendor.trim() || null,
          product_type: productCategory.trim() || null,
          price: parsedPrice,
          currency,
          image_count: uploaded.count,
        })
      : await createManualProduct({
          title: productTitle.trim(),
          price: parsedPrice,
          currency,
          product_type: productCategory.trim() || null,
          image_count: uploaded.count,
        });

    pushToast(result.message);
    if (result.ok) {
      closeProductModal();
    }
  };

  return {
    openModal,
    setOpenModal,
    productUrl,
    setProductUrl,
    productTitle,
    setProductTitle,
    productVendor,
    setProductVendor,
    productCategory,
    setProductCategory,
    productPrice,
    setProductPrice,
    productCurrency,
    setProductCurrency,
    imagePreviews,
    setImagePreviews,
    zoomedImageUrl,
    setZoomedImageUrl,
    closeProductModal,
    onDropImage,
    onPickImage,
    removePreviewImage,
    onFetchPreview,
    onSaveProduct,
  };
}
