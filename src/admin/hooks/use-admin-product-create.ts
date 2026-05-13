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
    description?: string | null;
    vendor?: string | null;
    currency: string;
    product_type: string | null;
    variants: Array<{ title: string; price: number | null; available: boolean }>;
    manual_image_asset_ids: number[];
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
  const [productDescription, setProductDescription] = useState<string>("");
  const [productCurrency, setProductCurrency] = useState<string>("USD");
  const [productVariants, setProductVariants] = useState<Array<{ title: string; price: string; available: boolean }>>([
    { title: "", price: "", available: true },
  ]);
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
    setProductDescription("");
    setProductCurrency("USD");
    setProductVariants([{ title: "", price: "", available: true }]);
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

  const removePreviewImage = (url: string) => {
    setImagePreviews((prev) => {
      const target = prev.find((item) => item.url === url);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.url !== url);
    });
  };

  const uploadSelectedImages = async () => {
    const imageAssetIds: number[] = [];
    for (const item of imagePreviews) {
      const uploadResult = await uploadProductImage(item.file);
      if (!uploadResult.ok || !uploadResult.imageAssetId) {
        pushToast(uploadResult.message);
        return { ok: false, imageAssetIds };
      }
      imageAssetIds.push(uploadResult.imageAssetId);
    }
    return { ok: true, imageAssetIds };
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
      setProductCurrency((result.preview.currency || "USD").toUpperCase());
      setProductVariants((prev) => {
        const next = [...prev];
        if (next.length === 0) {
          return [{ title: "Default", price: result.preview.price !== null ? String(result.preview.price) : "", available: true }];
        }
        if (!next[0].title.trim()) {
          next[0] = {
            ...next[0],
            title: "Default",
            price: result.preview.price !== null ? String(result.preview.price) : next[0].price,
          };
        }
        return next;
      });
    }
  };

  const onSaveProduct = async () => {
    if (!productTitle.trim()) {
      pushToast("Введите название товара");
      return;
    }

    const normalizedVariants = productVariants
      .map((item) => ({
        title: item.title.trim(),
        price: item.price.trim() ? Number(item.price) : null,
        available: item.available,
      }))
      .filter((item) => item.title.length > 0);
    if (normalizedVariants.length === 0) {
      pushToast("Добавь минимум один вариант");
      return;
    }
    if (normalizedVariants.some((item) => item.price !== null && Number.isNaN(item.price))) {
      pushToast("Цена варианта должна быть числом");
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
          price: normalizedVariants[0]?.price ?? null,
          currency,
          image_count: uploaded.imageAssetIds.length,
        })
      : await createManualProduct({
          title: productTitle.trim(),
          description: productDescription.trim() || null,
          vendor: productVendor.trim() || null,
          currency,
          product_type: productCategory.trim() || null,
          variants: normalizedVariants,
          manual_image_asset_ids: uploaded.imageAssetIds,
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
    productDescription,
    setProductDescription,
    productCurrency,
    setProductCurrency,
    productVariants,
    setProductVariants,
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
