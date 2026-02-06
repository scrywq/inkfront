import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Wallet,
  Settings as SettingsIcon,
  Eye,
  Sparkles,
  Send,
  ChevronDown,
  Paintbrush,
  MessageSquare,
  HelpCircle,
  QrCode,
  Clock,
  FileText,
  ScrollText,
  Boxes,
  Wrench,
  CreditCard,
  Gift,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/ui/GlassSelect";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { SettingsRow } from "@/components/dashboard/SettingsRow";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/Modal";
import { ProductEditor } from "@/components/dashboard/ProductEditor";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  deleteStoreProduct,
  duplicateStoreProduct,
  fetchCashbackConfig,
  fetchSaldoConfig,
  fetchSaldoUsers,
  fetchStoreCustomization,
  fetchStoreChannels,
  fetchStoreCustomers,
  fetchStoreOverview,
  fetchStorePreferences,
  fetchStoreProducts,
  fetchStoreRoles,
  addSaldoAdmin,
  removeSaldoAdmin,
  updateCashbackConfig,
  updateSaldoConfig,
  sendSaldoDepositPanel,
  sendProductToChannel,
  syncStoreCustomers,
  updateStoreCustomization,
  updateStorePreferences,
  uploadSaldoImage,
  uploadStoreCustomizationImage,
  type StoreChannel,
  type StoreCashbackConfig,
  type StoreCustomization,
  type StoreCustomer,
  type StoreOverview,
  type StoreSaldoConfig,
  type StoreSaldoUser,
  type StorePreferences,
  type StoreProduct,
  type StoreRole,
} from "@/lib/api/store";
import { useTenant } from "@/lib/tenant";

/* ─── Collapsible Section ─── */
function CollapsibleSection({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-white/[0.03] transition-colors duration-150"
      >
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductEditor, setShowProductEditor] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [, setOverview] = useState<StoreOverview | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  const [channels, setChannels] = useState<StoreChannel[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendChannelId, setSendChannelId] = useState("");
  const [sendMode, setSendMode] = useState("legacy");
  const [sendDescFormatted, setSendDescFormatted] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [customization, setCustomization] = useState<StoreCustomization | null>(null);
  const [customizationLoading, setCustomizationLoading] = useState(false);
  const [customizationSaving, setCustomizationSaving] = useState(false);
  const [customizationError, setCustomizationError] = useState<string | null>(null);
  const [customizationChannels, setCustomizationChannels] = useState<StoreChannel[]>([]);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [qrLogoPreview, setQrLogoPreview] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<StorePreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesChannels, setPreferencesChannels] = useState<StoreChannel[]>([]);
  const [roles, setRoles] = useState<StoreRole[]>([]);
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersSyncing, setCustomersSyncing] = useState(false);
  const [saldoConfig, setSaldoConfig] = useState<StoreSaldoConfig | null>(null);
  const [cashbackConfig, setCashbackConfig] = useState<StoreCashbackConfig | null>(null);
  const [saldoUsers, setSaldoUsers] = useState<StoreSaldoUser[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [saldoSaving, setSaldoSaving] = useState(false);
  const [cashbackSaving, setCashbackSaving] = useState(false);
  const [saldoPanelSending, setSaldoPanelSending] = useState(false);
  const [balanceTab, setBalanceTab] = useState("saldo-config");
  const [saldoEmbedPreview, setSaldoEmbedPreview] = useState<string | null>(null);
  const [saldoEmbedThumbPreview, setSaldoEmbedThumbPreview] = useState<string | null>(null);
  const [saldoContentImagePreview, setSaldoContentImagePreview] = useState<string | null>(null);
  const [saldoContainerImagePreview, setSaldoContainerImagePreview] = useState<string | null>(null);
  const [saldoContainerThumbPreview, setSaldoContainerThumbPreview] = useState<string | null>(null);
  const [showSaldoAdd, setShowSaldoAdd] = useState(false);
  const [showSaldoRemove, setShowSaldoRemove] = useState(false);
  const [saldoActionLoading, setSaldoActionLoading] = useState(false);
  const [saldoAddUserId, setSaldoAddUserId] = useState("");
  const [saldoAddAmount, setSaldoAddAmount] = useState("");
  const [saldoAddBonus, setSaldoAddBonus] = useState("");
  const [saldoAddMethod, setSaldoAddMethod] = useState("admin");
  const [saldoRemoveUserId, setSaldoRemoveUserId] = useState("");
  const [saldoRemoveAmount, setSaldoRemoveAmount] = useState("");
  const [saldoRemoveReason, setSaldoRemoveReason] = useState("");
  const [cashbackRuleRoleId, setCashbackRuleRoleId] = useState("");
  const [cashbackRuleMultiplier, setCashbackRuleMultiplier] = useState("1");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const customerRows = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        totalSpent: customer.total_spent,
        orders: customer.total_purchases,
        lastPurchase: customer.last_purchase
          ? new Date(customer.last_purchase * 1000).toISOString()
          : null,
      })),
    [customers]
  );

  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    const currentTenant = tenantId;
    setLoading(true);
    setProductError(null);
    setProducts([]);
    Promise.all([fetchStoreOverview(), fetchStoreProducts()])
      .then(([overviewData, productsData]) => {
        if (!mounted) return;
        if (currentTenant !== tenantId) return;
        setOverview(overviewData);
        setProducts(productsData);
      })
      .catch((error) => {
        if (!mounted) return;
        if (currentTenant !== tenantId) return;
        console.error("[store] load", error);
        setProductError("Não foi possível carregar a loja.");
      })
      .finally(() => {
        if (mounted && currentTenant === tenantId) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!showSendModal || !tenantId) return;
    let mounted = true;
    fetchStoreChannels()
      .then((data) => {
        if (mounted) setChannels(data);
      })
      .catch((error) => {
        console.error("[store] channels", error);
        if (mounted) setChannels([]);
      });
    return () => {
      mounted = false;
    };
  }, [showSendModal, tenantId]);

  useEffect(() => {
    if (activeTab !== "customization" || !tenantId) return;
    let mounted = true;
    setCustomizationLoading(true);
    setCustomizationError(null);
    Promise.all([fetchStoreCustomization(), fetchStoreChannels()])
      .then(([customData, channelData]) => {
        if (!mounted) return;
        setCustomization(customData);
        setCustomizationChannels(channelData);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("[store] customization load", error);
        setCustomizationError("Não foi possível carregar as configurações.");
      })
      .finally(() => {
        if (mounted) setCustomizationLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTab, tenantId]);

  useEffect(() => {
    if (activeTab !== "preferences" || !tenantId) return;
    let mounted = true;
    setPreferencesLoading(true);
    setPreferencesError(null);
    Promise.all([fetchStorePreferences(), fetchStoreChannels(), fetchStoreRoles()])
      .then(([prefsData, channelData, rolesData]) => {
        if (!mounted) return;
        setPreferences(prefsData);
        setPreferencesChannels(channelData);
        setRoles(rolesData);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("[store] preferences load", error);
        setPreferencesError("Não foi possível carregar as preferências.");
      })
      .finally(() => {
        if (mounted) setPreferencesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTab, tenantId]);

  useEffect(() => {
    if (activeTab !== "customers" || !tenantId) return;
    let mounted = true;
    setCustomersLoading(true);
    setCustomersError(null);
    fetchStoreCustomers()
      .then((data) => {
        if (!mounted) return;
        setCustomers(data);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("[store] customers load", error);
        setCustomersError("Não foi possível carregar os clientes.");
      })
      .finally(() => {
        if (mounted) setCustomersLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTab, tenantId]);

  useEffect(() => {
    if (activeTab !== "balance" || !tenantId) return;
    let mounted = true;
    setBalanceLoading(true);
    setBalanceError(null);
    Promise.all([fetchSaldoConfig(), fetchCashbackConfig(), fetchSaldoUsers(), fetchStoreChannels(), fetchStoreRoles()])
      .then(([saldoData, cashbackData, saldoUsersData, channelData, rolesData]) => {
        if (!mounted) return;
        setSaldoConfig(saldoData);
        setCashbackConfig(cashbackData);
        setSaldoUsers(saldoUsersData);
        setPreferencesChannels(channelData);
        setRoles(rolesData);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("[store] balance load", error);
        setBalanceError("Não foi possível carregar saldos e cashback.");
      })
      .finally(() => {
        if (mounted) setBalanceLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTab, tenantId]);

  useEffect(() => {
    return () => {
      if (eventImagePreview) {
        URL.revokeObjectURL(eventImagePreview);
      }
      if (qrLogoPreview) {
        URL.revokeObjectURL(qrLogoPreview);
      }
      if (saldoEmbedPreview) URL.revokeObjectURL(saldoEmbedPreview);
      if (saldoEmbedThumbPreview) URL.revokeObjectURL(saldoEmbedThumbPreview);
      if (saldoContentImagePreview) URL.revokeObjectURL(saldoContentImagePreview);
      if (saldoContainerImagePreview) URL.revokeObjectURL(saldoContainerImagePreview);
      if (saldoContainerThumbPreview) URL.revokeObjectURL(saldoContainerThumbPreview);
    };
  }, [
    eventImagePreview,
    qrLogoPreview,
    saldoEmbedPreview,
    saldoEmbedThumbPreview,
    saldoContentImagePreview,
    saldoContainerImagePreview,
    saldoContainerThumbPreview,
  ]);

  useEffect(() => {
    if (!tenantId) return;
    setShowSendModal(false);
    setShowProductEditor(false);
    setEditingProduct(null);
    setSendChannelId("");
    setSendMode("legacy");
    setSendDescFormatted(true);
    setChannels([]);
    setCustomization(null);
    setCustomizationChannels([]);
    setCustomizationError(null);
    setCustomizationLoading(false);
    setCustomizationSaving(false);
    setPreferences(null);
    setPreferencesChannels([]);
    setRoles([]);
    setPreferencesError(null);
    setPreferencesLoading(false);
    setPreferencesSaving(false);
    setCustomers([]);
    setCustomersError(null);
    setCustomersLoading(false);
    setCustomersSyncing(false);
    setSaldoConfig(null);
    setCashbackConfig(null);
    setSaldoUsers([]);
    setBalanceError(null);
    setBalanceLoading(false);
    setSaldoSaving(false);
    setCashbackSaving(false);
    setSaldoPanelSending(false);
    setShowSaldoAdd(false);
    setShowSaldoRemove(false);
    setSaldoActionLoading(false);
    setSaldoAddUserId("");
    setSaldoAddAmount("");
    setSaldoAddBonus("");
    setSaldoAddMethod("admin");
    setSaldoRemoveUserId("");
    setSaldoRemoveAmount("");
    setSaldoRemoveReason("");
    setCashbackRuleRoleId("");
    setCashbackRuleMultiplier("1");
    setBalanceTab("saldo-config");
    setSaldoEmbedPreview(null);
    setSaldoEmbedThumbPreview(null);
    setSaldoContentImagePreview(null);
    setSaldoContainerImagePreview(null);
    setSaldoContainerThumbPreview(null);
  }, [tenantId]);

  useEffect(() => {
    if (!showDeleteConfirm) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleConfirmDelete();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showDeleteConfirm, deleteTarget, deleting]);

  const handleEditProduct = (product: StoreProduct) => {
    setEditingProduct(product);
    setShowProductEditor(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowProductEditor(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteStoreProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("[store] delete product", error);
    }
  };

  const handleRequestDelete = (product: StoreProduct) => {
    setDeleteTarget(product);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleting) return;
    setDeleting(true);
    const target = deleteTarget;
    setProducts((prev) => prev.filter((p) => p.id !== target.id));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    try {
      await deleteStoreProduct(target.id);
    } catch (error) {
      console.error("[store] delete product", error);
      const message = error instanceof Error ? error.message : "Não foi possível excluir o produto.";
      setProductError(message);
      setProducts((prev) => [target, ...prev]);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    try {
      const duplicated = await duplicateStoreProduct(productId, true);
      setProducts((prev) => [duplicated, ...prev]);
    } catch (error) {
      console.error("[store] duplicate product", error);
    }
  };

  const handleOpenSend = (product: StoreProduct) => {
    setEditingProduct(product);
    setSendChannelId("");
    setSendMode("legacy");
    setSendDescFormatted(true);
    setShowSendModal(true);
  };

  const handleSendProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    if (sending) return;
    setSending(true);
    try {
      const result = await sendProductToChannel({
        product_id: editingProduct.id,
        channel_id: sendChannelId,
        mode: sendMode,
        formatted_desc: sendDescFormatted,
      });
      if (result.status !== "sent") {
        throw new Error("Envio em processamento");
      }
      setShowSendModal(false);
      setSendChannelId("");
    } catch (error) {
      console.error("[store] send product", error);
      setShowSendModal(false);
      setSendChannelId("");
    } finally {
      setSending(false);
    }
  };

  const handleCustomizationSave = async () => {
    if (!customization || customizationSaving) return;
    setCustomizationSaving(true);
    setCustomizationError(null);
    try {
      const updated = await updateStoreCustomization(customization);
      setCustomization(updated);
    } catch (error) {
      console.error("[store] customization save", error);
      setCustomizationError("Não foi possível salvar as configurações.");
    } finally {
      setCustomizationSaving(false);
    }
  };

  const handleCustomizationImage = async (
    type: "purchase_event" | "qr_logo",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (type === "purchase_event") {
        if (eventImagePreview) URL.revokeObjectURL(eventImagePreview);
        const preview = URL.createObjectURL(file);
        setEventImagePreview(preview);
      } else {
        if (qrLogoPreview) URL.revokeObjectURL(qrLogoPreview);
        const preview = URL.createObjectURL(file);
        setQrLogoPreview(preview);
      }
      const result = await uploadStoreCustomizationImage(type, file);
      setCustomization((prev) => {
        if (!prev) return prev;
        if (type === "purchase_event") {
          return {
            ...prev,
            purchase_event: { ...prev.purchase_event, image: result.url },
          };
        }
        return {
          ...prev,
          qr_customization: { ...prev.qr_customization, logo_url: result.url },
        };
      });
    } catch (error) {
      console.error("[store] customization image", error);
      setCustomizationError("Não foi possível enviar a imagem.");
    } finally {
      if (type === "purchase_event") {
        setEventImagePreview(null);
      } else {
        setQrLogoPreview(null);
      }
    }
  };

  const handlePreferencesSave = async () => {
    if (!preferences || preferencesSaving) return;
    setPreferencesSaving(true);
    setPreferencesError(null);
    try {
      const updated = await updateStorePreferences(preferences);
      setPreferences(updated);
    } catch (error) {
      console.error("[store] preferences save", error);
      setPreferencesError("Não foi possível salvar as preferências.");
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleSyncCustomers = async () => {
    if (customersSyncing) return;
    setCustomersSyncing(true);
    setCustomersError(null);
    try {
      await syncStoreCustomers();
      const data = await fetchStoreCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("[store] customers sync", error);
      setCustomersError("Não foi possível sincronizar os clientes.");
    } finally {
      setCustomersSyncing(false);
    }
  };

  const handleSaldoSave = async () => {
    if (!saldoConfig || saldoSaving) return;
    setSaldoSaving(true);
    setBalanceError(null);
    try {
      const updated = await updateSaldoConfig(saldoConfig);
      setSaldoConfig(updated);
    } catch (error) {
      console.error("[store] saldo save", error);
      setBalanceError("Não foi possível salvar o saldo.");
    } finally {
      setSaldoSaving(false);
    }
  };

  const handleCashbackSave = async () => {
    if (!cashbackConfig || cashbackSaving) return;
    setCashbackSaving(true);
    setBalanceError(null);
    try {
      const updated = await updateCashbackConfig(cashbackConfig);
      setCashbackConfig(updated);
    } catch (error) {
      console.error("[store] cashback save", error);
      setBalanceError("Não foi possível salvar o cashback.");
    } finally {
      setCashbackSaving(false);
    }
  };

  const handleSaldoImage = async (
    target: "embed_image" | "embed_thumb" | "content_image" | "container_image" | "container_thumb",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const previewUrl = URL.createObjectURL(file);
      if (target === "embed_image") {
        if (saldoEmbedPreview) URL.revokeObjectURL(saldoEmbedPreview);
        setSaldoEmbedPreview(previewUrl);
      }
      if (target === "embed_thumb") {
        if (saldoEmbedThumbPreview) URL.revokeObjectURL(saldoEmbedThumbPreview);
        setSaldoEmbedThumbPreview(previewUrl);
      }
      if (target === "content_image") {
        if (saldoContentImagePreview) URL.revokeObjectURL(saldoContentImagePreview);
        setSaldoContentImagePreview(previewUrl);
      }
      if (target === "container_image") {
        if (saldoContainerImagePreview) URL.revokeObjectURL(saldoContainerImagePreview);
        setSaldoContainerImagePreview(previewUrl);
      }
      if (target === "container_thumb") {
        if (saldoContainerThumbPreview) URL.revokeObjectURL(saldoContainerThumbPreview);
        setSaldoContainerThumbPreview(previewUrl);
      }
      const result = await uploadSaldoImage(target, file);
      setSaldoConfig((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (target === "embed_image") next.deposit_panel.embed.image_url = result.url;
        if (target === "embed_thumb") next.deposit_panel.embed.thumbnail_url = result.url;
        if (target === "content_image") next.deposit_panel.content.image_url = result.url;
        if (target === "container_image") next.deposit_panel.container.image_url = result.url;
        if (target === "container_thumb") next.deposit_panel.container.thumbnail_url = result.url;
        return { ...next };
      });
    } catch (error) {
      console.error("[store] saldo image", error);
      setBalanceError("Não foi possível enviar a imagem.");
    }
  };

  const handleSaldoAdminAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saldoActionLoading) return;
    setSaldoActionLoading(true);
    setBalanceError(null);
    try {
      await addSaldoAdmin({
        user_id: saldoAddUserId,
        amount: Number(saldoAddAmount),
        bonus: saldoAddBonus ? Number(saldoAddBonus) : undefined,
        payment_method: saldoAddMethod || "admin",
      });
      setShowSaldoAdd(false);
      setSaldoAddUserId("");
      setSaldoAddAmount("");
      setSaldoAddBonus("");
      setSaldoAddMethod("admin");
      const users = await fetchSaldoUsers();
      setSaldoUsers(users);
    } catch (error) {
      console.error("[store] saldo add", error);
      setBalanceError("Não foi possível adicionar saldo.");
    } finally {
      setSaldoActionLoading(false);
    }
  };

  const handleSaldoAdminRemove = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saldoActionLoading) return;
    setSaldoActionLoading(true);
    setBalanceError(null);
    try {
      await removeSaldoAdmin({
        user_id: saldoRemoveUserId,
        amount: Number(saldoRemoveAmount),
        description: saldoRemoveReason || undefined,
      });
      setShowSaldoRemove(false);
      setSaldoRemoveUserId("");
      setSaldoRemoveAmount("");
      setSaldoRemoveReason("");
      const users = await fetchSaldoUsers();
      setSaldoUsers(users);
    } catch (error) {
      console.error("[store] saldo remove", error);
      setBalanceError("Não foi possível remover saldo.");
    } finally {
      setSaldoActionLoading(false);
    }
  };

  const handleSendSaldoPanel = async () => {
    if (!saldoConfig?.deposit_panel.channel_id || saldoPanelSending) return;
    setSaldoPanelSending(true);
    setBalanceError(null);
    try {
      await updateSaldoConfig(saldoConfig);
      await sendSaldoDepositPanel(saldoConfig.deposit_panel.channel_id);
    } catch (error) {
      console.error("[store] saldo panel send", error);
      setBalanceError("Não foi possível enviar o painel de depósito.");
    } finally {
      setSaldoPanelSending(false);
    }
  };

  if (showProductEditor) {
    return (
      <ProductEditor
        product={editingProduct}
        onBack={() => {
          setShowProductEditor(false);
          setEditingProduct(null);
          fetchStoreProducts()
            .then((data) => setProducts(data))
            .catch((error) => console.error("[store] refresh products", error));
        }}
        onSaved={(product) => {
          setProducts((prev) => {
            const exists = prev.find((p) => p.id === product.id);
            if (exists) {
              return prev.map((p) => (p.id === product.id ? product : p));
            }
            return [product, ...prev];
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loja</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie produtos, clientes e configurações da loja
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl flex-wrap h-auto gap-1">
          {[
            { value: "products", icon: Package, label: "Produtos" },
            { value: "customization", icon: Paintbrush, label: "Personalização" },
            { value: "preferences", icon: SettingsIcon, label: "Preferências" },
            { value: "customers", icon: Users, label: "Clientes" },
            { value: "balance", icon: Wallet, label: "Saldo & Cashback" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg data-[state=active]:bg-white/10 transition-colors duration-150 gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="products">
          <GlassCard className="p-5" hover={false}>
            <SectionHeader
              title="Produtos"
              description={`${products.length} produtos cadastrados`}
              actions={
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150 w-48"
                    />
                  </div>
                  <GlassButton size="sm" onClick={handleNewProduct}>
                    <Plus className="w-4 h-4" />
                    Novo produto
                  </GlassButton>
                </div>
              }
            />

            {productError && (
              <p className="text-sm text-destructive mb-3">{productError}</p>
            )}

            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Produto",
                  render: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "price",
                  header: "Preço",
                  render: (item) => (
                    <span className="font-medium">
                      {item.min_price === item.max_price
                        ? formatCurrency(item.min_price)
                        : `${formatCurrency(item.min_price)} - ${formatCurrency(item.max_price)}`}
                    </span>
                  ),
                },
                {
                  key: "stock",
                  header: "Estoque",
                  render: (item) => (
                    <span
                      className={cn(
                        "font-medium px-2.5 py-1 rounded-lg text-xs",
                        item.has_infinite_stock && "text-success bg-success/10",
                        item.stock_total !== null && item.stock_total < 5 && "text-warning bg-warning/10",
                        item.stock_total === 0 && "text-destructive bg-destructive/10"
                      )}
                    >
                      {item.has_infinite_stock ? "Ilimitado" : item.stock_total ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "sales",
                  header: "Vendas",
                  render: (item) => (
                    <span className="font-medium">{item.info?.purchasesIds?.length || 0}</span>
                  ),
                },
                {
                  key: "active",
                  header: "Status",
                  render: (item) => (
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5",
                        item.info?.active !== false
                          ? "bg-success/15 text-success"
                          : "bg-white/[0.04] text-muted-foreground"
                      )}
                    >
                      {item.info?.active !== false && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                      {item.info?.active !== false ? "Ativo" : "Inativo"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  render: (item) => (
                    <div className="flex items-center gap-0.5">
                      <button
                        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors duration-150 active:scale-95"
                        onClick={() => handleEditProduct(item)}
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors duration-150 active:scale-95"
                        onClick={() => handleEditProduct(item)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors duration-150 active:scale-95"
                        onClick={() => handleDuplicateProduct(item.id)}
                        title="Duplicar"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors duration-150 active:scale-95"
                        onClick={() => handleOpenSend(item)}
                        title="Enviar"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors duration-150 text-destructive active:scale-95"
                        onClick={() => handleRequestDelete(item)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                  className: "w-36",
                },
              ]}
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              emptyMessage={loading ? "Carregando..." : "Nenhum produto encontrado"}
            />
          </GlassCard>
        </TabsContent>

        <TabsContent value="customization">
          <GlassCard className="p-5" hover={false}>
            <SectionHeader
              title="Personalização"
              description="Configure mensagens e aparência da loja"
              actions={
                <GlassButton size="sm" onClick={handleCustomizationSave} disabled={customizationSaving}>
                  {customizationSaving ? "Salvando..." : "Salvar alterações"}
                </GlassButton>
              }
            />
            {customizationError && (
              <p className="text-sm text-destructive mb-3">{customizationError}</p>
            )}
            {customizationLoading || !customization ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <div className="space-y-3">
                {/* Purchase Event */}
                <CollapsibleSection
                  icon={Paintbrush}
                  title="Evento de Compra"
                  description="Cor e imagem exibidos ao finalizar uma compra"
                  defaultOpen
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Cor do Evento</label>
                      <ColorPicker
                        value={customization.purchase_event.color || ""}
                        onChange={(value) =>
                          setCustomization((prev) =>
                            prev
                              ? { ...prev, purchase_event: { ...prev.purchase_event, color: value } }
                              : prev
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Imagem do Evento</label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" onChange={(e) => handleCustomizationImage("purchase_event", e)} className="hidden" />
                          <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.06] transition-colors duration-150">
                            Enviar imagem
                          </div>
                        </label>
                        {customization.purchase_event.image && (
                          <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setCustomization((prev) => prev ? { ...prev, purchase_event: { ...prev.purchase_event, image: "" } } : prev)}>
                            Remover
                          </button>
                        )}
                      </div>
                      {(eventImagePreview || customization.purchase_event.image) && (
                        <img src={eventImagePreview || customization.purchase_event.image} alt="" className="mt-3 h-24 rounded-lg object-cover border border-white/[0.08]" />
                      )}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Feedback Incentive */}
                <CollapsibleSection
                  icon={MessageSquare}
                  title="Incentivo de Feedback"
                  description="Mensagem e botão exibidos após a compra"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Mensagem</label>
                      <textarea
                        value={customization.feedback_incentive.message}
                        onChange={(e) => setCustomization((prev) => prev ? { ...prev, feedback_incentive: { ...prev.feedback_incentive, message: e.target.value } } : prev)}
                        rows={3}
                        className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150 resize-none"
                      />
                    </div>
                    <div className="max-w-sm">
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Texto do Botão</label>
                      <input
                        type="text"
                        value={customization.feedback_incentive.button_text}
                        onChange={(e) => setCustomization((prev) => prev ? { ...prev, feedback_incentive: { ...prev.feedback_incentive, button_text: e.target.value } } : prev)}
                        className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Doubt Button */}
                <CollapsibleSection
                  icon={HelpCircle}
                  title="Botão de Dúvidas"
                  description="Botão exibido em todos os produtos para tirar dúvidas"
                >
                  <SettingsRow
                    label="Ativar botão de dúvidas"
                    description="Mostra um botão em todos os produtos"
                    control={
                      <Switch
                        checked={customization.doubt_button.enabled}
                        onCheckedChange={(checked) => setCustomization((prev) => prev ? { ...prev, doubt_button: { ...prev.doubt_button, enabled: checked } } : prev)}
                      />
                    }
                  />
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Texto do Botão</label>
                      <input
                        type="text"
                        value={customization.doubt_button.button_label}
                        onChange={(e) => setCustomization((prev) => prev ? { ...prev, doubt_button: { ...prev.doubt_button, button_label: e.target.value } } : prev)}
                        className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Emoji do Botão</label>
                      <EmojiPicker
                        value={customization.doubt_button.button_emoji}
                        onChange={(value) => setCustomization((prev) => prev ? { ...prev, doubt_button: { ...prev.doubt_button, button_emoji: value || "" } } : prev)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Canal de Dúvidas</label>
                      <GlassSelect
                        value={customization.doubt_button.channel_id || ""}
                        onValueChange={(value) => setCustomization((prev) => prev ? { ...prev, doubt_button: { ...prev.doubt_button, channel_id: value } } : prev)}
                      >
                        <GlassSelectTrigger>
                          <GlassSelectValue placeholder="Selecione um canal" />
                        </GlassSelectTrigger>
                        <GlassSelectContent>
                          {customizationChannels.map((channel) => (
                            <GlassSelectItem key={channel.id} value={channel.id}>#{channel.name}</GlassSelectItem>
                          ))}
                        </GlassSelectContent>
                      </GlassSelect>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Mensagem Inicial</label>
                      <textarea
                        value={customization.doubt_button.message}
                        onChange={(e) => setCustomization((prev) => prev ? { ...prev, doubt_button: { ...prev.doubt_button, message: e.target.value } } : prev)}
                        rows={3}
                        className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150 resize-none"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* QR Code */}
                <CollapsibleSection
                  icon={QrCode}
                  title="QR Code Pix"
                  description="Personalização visual do QR Code de pagamento"
                >
                  <SettingsRow
                    label="Ativar personalização do QR Code"
                    description="Aplica cores e logo personalizados"
                    control={
                      <Switch
                        checked={customization.qr_customization.enabled}
                        onCheckedChange={(checked) => setCustomization((prev) => prev ? { ...prev, qr_customization: { ...prev.qr_customization, enabled: checked } } : prev)}
                      />
                    }
                  />
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Cor do QR</label>
                      <ColorPicker
                        value={customization.qr_customization.color}
                        onChange={(value) => setCustomization((prev) => prev ? { ...prev, qr_customization: { ...prev.qr_customization, color: value } } : prev)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Cor de Fundo</label>
                      <ColorPicker
                        value={customization.qr_customization.background_color}
                        onChange={(value) => setCustomization((prev) => prev ? { ...prev, qr_customization: { ...prev.qr_customization, background_color: value } } : prev)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Logo do QR</label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" onChange={(e) => handleCustomizationImage("qr_logo", e)} className="hidden" />
                          <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.06] transition-colors duration-150">
                            Enviar imagem
                          </div>
                        </label>
                        {customization.qr_customization.logo_url && (
                          <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setCustomization((prev) => prev ? { ...prev, qr_customization: { ...prev.qr_customization, logo_url: "" } } : prev)}>
                            Remover
                          </button>
                        )}
                      </div>
                      {(qrLogoPreview || customization.qr_customization.logo_url) && (
                        <img src={qrLogoPreview || customization.qr_customization.logo_url} alt="" className="mt-3 h-20 rounded-lg object-cover border border-white/[0.08]" />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Tamanho do Logo (0.1 a 0.5)</label>
                      <input
                        type="number" min="0.1" max="0.5" step="0.1"
                        value={customization.qr_customization.logo_size}
                        onChange={(e) => setCustomization((prev) => prev ? { ...prev, qr_customization: { ...prev.qr_customization, logo_size: Number(e.target.value) } } : prev)}
                        className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Estilo dos Cantos</label>
                      <GlassSelect
                        value={customization.qr_customization.corner_style}
                        onValueChange={(value) => setCustomization((prev) => prev ? { ...prev, qr_customization: { ...prev.qr_customization, corner_style: value } } : prev)}
                      >
                        <GlassSelectTrigger>
                          <GlassSelectValue placeholder="Selecione..." />
                        </GlassSelectTrigger>
                        <GlassSelectContent>
                          <GlassSelectItem value="square">Square</GlassSelectItem>
                          <GlassSelectItem value="rounded">Rounded</GlassSelectItem>
                          <GlassSelectItem value="dots">Dots</GlassSelectItem>
                        </GlassSelectContent>
                      </GlassSelect>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="preferences">
          <GlassCard className="p-5" hover={false}>
            <SectionHeader
              title="Preferências da Loja"
              description="Configurações gerais da loja"
              actions={
                <GlassButton size="sm" onClick={handlePreferencesSave} disabled={!preferences || preferencesSaving}>
                  {preferencesSaving ? "Salvando..." : "Salvar alterações"}
                </GlassButton>
              }
            />

            {preferencesLoading && <div className="text-sm text-muted-foreground">Carregando preferências...</div>}
            {preferencesError && <div className="text-sm text-destructive">{preferencesError}</div>}

            {preferences && (
              <div className="space-y-3">
                {/* Cart Duration */}
                <CollapsibleSection icon={CreditCard} title="Carrinho" description="Tempo de expiração do carrinho" defaultOpen>
                  <SettingsRow
                    label="Tempo do carrinho"
                    description="Define o tempo padrão de expiração"
                    control={
                      <GlassSelect value={String(preferences.cart_duration_minutes)} onValueChange={(value) => setPreferences((prev) => prev ? { ...prev, cart_duration_minutes: Number(value) } : prev)}>
                        <GlassSelectTrigger className="w-36">
                          <GlassSelectValue placeholder="Selecione..." />
                        </GlassSelectTrigger>
                        <GlassSelectContent>
                          {[10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => (
                            <GlassSelectItem key={minutes} value={String(minutes)}>{minutes} minutos</GlassSelectItem>
                          ))}
                        </GlassSelectContent>
                      </GlassSelect>
                    }
                  />
                </CollapsibleSection>

                {/* Office Hours */}
                <CollapsibleSection icon={Clock} title="Horário de Funcionamento" description="Defina horários em que a loja fica ativa">
                  <SettingsRow
                    label="Ativar horário"
                    description="Limitar funcionamento da loja por horário"
                    control={
                      <Switch checked={preferences.office_hours.enabled} onCheckedChange={(checked) => setPreferences((prev) => prev ? { ...prev, office_hours: { ...prev.office_hours, enabled: checked } } : prev)} />
                    }
                  />
                  <div className="grid gap-3 md:grid-cols-2 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Abertura</label>
                      <input type="text" value={preferences.office_hours.start_time} onChange={(e) => setPreferences((prev) => prev ? { ...prev, office_hours: { ...prev.office_hours, start_time: e.target.value } } : prev)} placeholder="09:00" className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Fechamento</label>
                      <input type="text" value={preferences.office_hours.end_time} onChange={(e) => setPreferences((prev) => prev ? { ...prev, office_hours: { ...prev.office_hours, end_time: e.target.value } } : prev)} placeholder="18:00" className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Dias sem funcionamento</label>
                      <input type="text" value={preferences.office_hours.off_days.join(",")} onChange={(e) => { const days = e.target.value.split(",").map((d) => d.trim()).filter(Boolean); setPreferences((prev) => prev ? { ...prev, office_hours: { ...prev.office_hours, off_days: days } } : prev); }} placeholder="seg,ter,qua,qui,sex" className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Mensagem fora de horário</label>
                      <textarea value={preferences.office_hours.message} onChange={(e) => setPreferences((prev) => prev ? { ...prev, office_hours: { ...prev.office_hours, message: e.target.value } } : prev)} placeholder={"Nosso horário de atendimento é das {start_time} às {end_time}."} rows={3} className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150 resize-none" />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Terms */}
                <CollapsibleSection icon={FileText} title="Termos de Uso" description="Exigir aceitação dos termos antes da compra">
                  <SettingsRow
                    label="Ativar termos"
                    description="Usuários devem aceitar antes de comprar"
                    control={
                      <Switch checked={preferences.terms.enabled} onCheckedChange={(checked) => setPreferences((prev) => prev ? { ...prev, terms: { ...prev.terms, enabled: checked } } : prev)} />
                    }
                  />
                  <div className="pt-2">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">Texto dos termos</label>
                    <textarea value={preferences.terms.text} onChange={(e) => setPreferences((prev) => prev ? { ...prev, terms: { ...prev.terms, text: e.target.value } } : prev)} placeholder="Digite os termos que os usuários precisam aceitar..." rows={4} className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150 resize-none" />
                  </div>
                </CollapsibleSection>

                {/* Transcripts */}
                <CollapsibleSection icon={ScrollText} title="Transcripts" description="Salvar histórico de compras em um canal">
                  <SettingsRow
                    label="Ativar transcripts"
                    description="Salvar histórico de compras automaticamente"
                    control={
                      <Switch checked={preferences.transcript_enabled} onCheckedChange={(checked) => setPreferences((prev) => prev ? { ...prev, transcript_enabled: checked } : prev)} />
                    }
                  />
                  <div className="pt-2">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">Canal de transcripts</label>
                    <GlassSelect value={preferences.transcript_channel_id || ""} onValueChange={(value) => setPreferences((prev) => prev ? { ...prev, transcript_channel_id: value } : prev)}>
                      <GlassSelectTrigger>
                        <GlassSelectValue placeholder="Selecione um canal" />
                      </GlassSelectTrigger>
                      <GlassSelectContent>
                        {preferencesChannels.map((channel) => (
                          <GlassSelectItem key={channel.id} value={channel.id}>#{channel.name}</GlassSelectItem>
                        ))}
                      </GlassSelectContent>
                    </GlassSelect>
                  </div>
                </CollapsibleSection>

                {/* Stock Requests */}
                <CollapsibleSection icon={Boxes} title="Solicitação de Reposição" description="Notificar quando estoque estiver baixo">
                  <SettingsRow
                    label="Ativar notificação"
                    description="Enviar alerta de estoque baixo"
                    control={
                      <Switch checked={preferences.stock_requests.enabled} onCheckedChange={(checked) => setPreferences((prev) => prev ? { ...prev, stock_requests: { ...prev.stock_requests, enabled: checked } } : prev)} />
                    }
                  />
                  <div className="grid gap-3 md:grid-cols-2 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Canal</label>
                      <GlassSelect value={preferences.stock_requests.channel_id || ""} onValueChange={(value) => setPreferences((prev) => prev ? { ...prev, stock_requests: { ...prev.stock_requests, channel_id: value } } : prev)}>
                        <GlassSelectTrigger><GlassSelectValue placeholder="Selecione um canal" /></GlassSelectTrigger>
                        <GlassSelectContent>
                          {preferencesChannels.map((channel) => (<GlassSelectItem key={channel.id} value={channel.id}>#{channel.name}</GlassSelectItem>))}
                        </GlassSelectContent>
                      </GlassSelect>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Cargo</label>
                      <GlassSelect value={preferences.stock_requests.role_id || ""} onValueChange={(value) => setPreferences((prev) => prev ? { ...prev, stock_requests: { ...prev.stock_requests, role_id: value } } : prev)}>
                        <GlassSelectTrigger><GlassSelectValue placeholder="Selecione um cargo" /></GlassSelectTrigger>
                        <GlassSelectContent>
                          {roles.map((role) => (<GlassSelectItem key={role.id} value={role.id}>{role.name}</GlassSelectItem>))}
                        </GlassSelectContent>
                      </GlassSelect>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Maintenance */}
                <CollapsibleSection icon={Wrench} title="Modo Manutenção" description="Desativar temporariamente a loja">
                  <SettingsRow
                    label="Modo manutenção"
                    description="Desativar a loja temporariamente"
                    control={
                      <Switch checked={preferences.maintenance.enabled} onCheckedChange={(checked) => setPreferences((prev) => prev ? { ...prev, maintenance: { ...prev.maintenance, enabled: checked } } : prev)} />
                    }
                  />
                  <SettingsRow
                    label="Permitir admins"
                    description="Admins podem comprar em manutenção"
                    control={
                      <Switch checked={preferences.maintenance.allow_admins} onCheckedChange={(checked) => setPreferences((prev) => prev ? { ...prev, maintenance: { ...prev.maintenance, allow_admins: checked } } : prev)} />
                    }
                  />
                  <div className="pt-2">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">Mensagem de manutenção</label>
                    <textarea value={preferences.maintenance.message} onChange={(e) => setPreferences((prev) => prev ? { ...prev, maintenance: { ...prev.maintenance, message: e.target.value } } : prev)} placeholder={"Olá, {user} a loja está em manutenção, tente novamente mais tarde."} rows={3} className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-white/20 transition-colors duration-150 resize-none" />
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="customers">
          <GlassCard className="p-5" hover={false}>
            <SectionHeader
              title="Clientes"
              description="Gerencie seus clientes e sincronize dados"
              actions={
                <GlassButton size="sm" onClick={handleSyncCustomers} disabled={customersSyncing}>
                  <Users className="w-4 h-4" />
                  {customersSyncing ? "Sincronizando..." : "Sincronizar"}
                </GlassButton>
              }
            />
            {customersLoading && <div className="text-sm text-muted-foreground mb-4">Carregando clientes...</div>}
            {customersError && <div className="text-sm text-destructive mb-4">{customersError}</div>}
            <DataTable
              columns={[
                {
                  key: "username",
                  header: "Cliente",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      {row.avatar ? (
                        <img src={row.avatar} alt={row.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                      )}
                      <span className="font-medium">{row.username}</span>
                    </div>
                  ),
                },
                {
                  key: "totalSpent",
                  header: "Total Gasto",
                  render: (row) => <span className="font-medium text-success">{formatCurrency(row.totalSpent || 0)}</span>,
                },
                {
                  key: "orders",
                  header: "Pedidos",
                  render: (row) => <span className="font-medium">{row.orders || 0}</span>,
                },
                {
                  key: "lastPurchase",
                  header: "Última Compra",
                  render: (row) => row.lastPurchase ? formatDate(row.lastPurchase) : "—",
                },
                {
                  key: "balance",
                  header: "Saldo",
                  render: () => <span className="font-medium">—</span>,
                },
              ]}
              data={customerRows}
              keyExtractor={(row) => row.id}
              emptyMessage="Nenhum cliente encontrado"
            />
          </GlassCard>
        </TabsContent>

        <TabsContent value="balance">
          <div className="space-y-6">
            {balanceLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
            {balanceError && <div className="text-sm text-destructive">{balanceError}</div>}

            <Tabs value={balanceTab} onValueChange={setBalanceTab} className="space-y-6">
              <TabsList className="bg-white/[0.03] border border-white/5 p-1 rounded-xl flex flex-wrap gap-1 h-auto">
                <TabsTrigger value="saldo-config" className="rounded-lg data-[state=active]:bg-white/10 gap-2 text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                  Saldo
                </TabsTrigger>
                <TabsTrigger value="saldo-panel" className="rounded-lg data-[state=active]:bg-white/10 gap-2 text-xs">
                  <Send className="w-3.5 h-3.5" />
                  Painel de Deposito
                </TabsTrigger>
                <TabsTrigger value="saldo-admin" className="rounded-lg data-[state=active]:bg-white/10 gap-2 text-xs">
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="saldo-users" className="rounded-lg data-[state=active]:bg-white/10 gap-2 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Saldos dos Clientes
                </TabsTrigger>
                <TabsTrigger value="cashback" className="rounded-lg data-[state=active]:bg-white/10 gap-2 text-xs">
                  <Gift className="w-3.5 h-3.5" />
                  Cashback
                </TabsTrigger>
              </TabsList>

              {/* ── Saldo Config ── */}
              <TabsContent value="saldo-config">
                <GlassCard className="p-5" hover={false}>
                  <SectionHeader
                    title="Configuracao de Saldo"
                    description="Ative o sistema de saldo e configure bonus, regras de uso e depositos"
                  />
                  {saldoConfig && (
                    <div className="space-y-6 mt-2">
                      {/* Status toggle */}
                      <SettingsRow
                        label="Saldo ativo"
                        description="Ativar ou desativar o sistema de saldo"
                        control={
                          <Switch
                            checked={saldoConfig.enabled}
                            onCheckedChange={(checked) =>
                              setSaldoConfig((prev) => (prev ? { ...prev, enabled: checked } : prev))
                            }
                          />
                        }
                      />

                      {/* Bonus section */}
                      <CollapsibleSection icon={Sparkles} title="Bonus" description="Configure o bonus de deposito">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de bonus</label>
                            <GlassSelect
                              value={saldoConfig.bonus.type}
                              onValueChange={(value) =>
                                setSaldoConfig((prev) =>
                                  prev ? { ...prev, bonus: { ...prev.bonus, type: value as any } } : prev
                                )
                              }
                            >
                              <GlassSelectTrigger>
                                <GlassSelectValue placeholder="Selecione..." />
                              </GlassSelectTrigger>
                              <GlassSelectContent>
                                <GlassSelectItem value="disabled">Desativado</GlassSelectItem>
                                <GlassSelectItem value="percentage">Percentual</GlassSelectItem>
                                <GlassSelectItem value="fixed">Fixo</GlassSelectItem>
                              </GlassSelectContent>
                            </GlassSelect>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Valor do bonus</label>
                            <input
                              type="number"
                              step="0.01"
                              value={saldoConfig.bonus.value}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev ? { ...prev, bonus: { ...prev.bonus, value: Number(e.target.value) } } : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* Usage rules */}
                      <CollapsibleSection icon={ScrollText} title="Regras de Uso" description="Limites e permissoes de uso do saldo">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Max. uso (%)</label>
                            <input
                              type="number"
                              value={saldoConfig.rules.max_usage_percentage}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rules: { ...prev.rules, max_usage_percentage: Number(e.target.value) },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Max. uso (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={saldoConfig.rules.max_usage_amount ?? ""}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rules: {
                                          ...prev.rules,
                                          max_usage_amount: e.target.value ? Number(e.target.value) : null,
                                        },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Min. uso (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={saldoConfig.rules.min_usage_amount}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rules: { ...prev.rules, min_usage_amount: Number(e.target.value) },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        </div>
                        <SettingsRow
                          label="Pagamento parcial"
                          description="Permitir usar saldo parcial"
                          control={
                            <Switch
                              checked={saldoConfig.rules.allow_partial_payment}
                              onCheckedChange={(checked) =>
                                setSaldoConfig((prev) =>
                                  prev ? { ...prev, rules: { ...prev.rules, allow_partial_payment: checked } } : prev
                                )
                              }
                            />
                          }
                        />
                      </CollapsibleSection>

                      {/* Deposit settings */}
                      <CollapsibleSection icon={Wallet} title="Deposito" description="Limites de deposito, notificacao e termos">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Deposito minimo (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={saldoConfig.deposit_settings.min_deposit}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_settings: {
                                          ...prev.deposit_settings,
                                          min_deposit: Number(e.target.value),
                                        },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Deposito maximo (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={saldoConfig.deposit_settings.max_deposit}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_settings: {
                                          ...prev.deposit_settings,
                                          max_deposit: Number(e.target.value),
                                        },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Cargo de notificacao</label>
                            <GlassSelect
                              value={saldoConfig.deposit_settings.notify_role_id || ""}
                              onValueChange={(value) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_settings: { ...prev.deposit_settings, notify_role_id: value },
                                      }
                                    : prev
                                )
                              }
                            >
                              <GlassSelectTrigger>
                                <GlassSelectValue placeholder="Selecione um cargo" />
                              </GlassSelectTrigger>
                              <GlassSelectContent>
                                {roles.map((role) => (
                                  <GlassSelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </GlassSelectItem>
                                ))}
                              </GlassSelectContent>
                            </GlassSelect>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Termos</label>
                            <input
                              type="text"
                              value={saldoConfig.deposit_settings.terms || ""}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_settings: { ...prev.deposit_settings, terms: e.target.value },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* Save footer */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <GlassButton size="sm" variant="primary" onClick={handleSaldoSave} disabled={saldoSaving}>
                          {saldoSaving ? "Salvando..." : "Salvar Configuracoes"}
                        </GlassButton>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              {/* ── Deposit Panel ── */}
              <TabsContent value="saldo-panel">
                <GlassCard className="p-5" hover={false}>
                  <SectionHeader
                    title="Painel de Deposito"
                    description="Configure a mensagem e botao do painel de deposito no Discord"
                  />
                  {saldoConfig && (
                    <div className="space-y-6 mt-2">
                      {/* Message style */}
                      <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div>
                          <p className="text-sm font-medium">Estilo da mensagem</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Embed, Texto ou Container</p>
                        </div>
                        <GlassSelect
                          value={saldoConfig.deposit_panel.message_style}
                          onValueChange={(value) =>
                            setSaldoConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    deposit_panel: { ...prev.deposit_panel, message_style: value as any },
                                  }
                                : prev
                            )
                          }
                        >
                          <GlassSelectTrigger className="w-40">
                            <GlassSelectValue />
                          </GlassSelectTrigger>
                          <GlassSelectContent>
                            <GlassSelectItem value="embed">Embed</GlassSelectItem>
                            <GlassSelectItem value="content">Texto</GlassSelectItem>
                            <GlassSelectItem value="container">Container</GlassSelectItem>
                          </GlassSelectContent>
                        </GlassSelect>
                      </div>

                      {/* Embed style fields */}
                      {saldoConfig.deposit_panel.message_style === "embed" && (
                        <CollapsibleSection icon={MessageSquare} title="Conteudo do Embed" description="Titulo, descricao, cor e imagens" defaultOpen>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Titulo</label>
                              <input
                                type="text"
                                value={saldoConfig.deposit_panel.embed.title}
                                onChange={(e) =>
                                  setSaldoConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          deposit_panel: {
                                            ...prev.deposit_panel,
                                            embed: { ...prev.deposit_panel.embed, title: e.target.value },
                                          },
                                        }
                                      : prev
                                  )
                                }
                                className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Cor</label>
                              <ColorPicker
                                value={saldoConfig.deposit_panel.embed.color}
                                onChange={(value) =>
                                  setSaldoConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          deposit_panel: {
                                            ...prev.deposit_panel,
                                            embed: { ...prev.deposit_panel.embed, color: value },
                                          },
                                        }
                                      : prev
                                  )
                                }
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-sm font-medium">Descricao</label>
                              <textarea
                                value={saldoConfig.deposit_panel.embed.description}
                                onChange={(e) =>
                                  setSaldoConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          deposit_panel: {
                                            ...prev.deposit_panel,
                                            embed: { ...prev.deposit_panel.embed, description: e.target.value },
                                          },
                                        }
                                      : prev
                                  )
                                }
                                rows={3}
                                className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Imagem</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer">
                                  <Eye className="w-3.5 h-3.5" />
                                  Escolher arquivo
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(e) => handleSaldoImage("embed_image", e)}
                                    className="hidden"
                                  />
                                </label>
                                {(saldoEmbedPreview || saldoConfig.deposit_panel.embed.image_url) && (
                                  <img
                                    src={saldoEmbedPreview || saldoConfig.deposit_panel.embed.image_url || ""}
                                    alt="Preview"
                                    className="h-10 w-10 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Thumbnail</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer">
                                  <Eye className="w-3.5 h-3.5" />
                                  Escolher arquivo
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(e) => handleSaldoImage("embed_thumb", e)}
                                    className="hidden"
                                  />
                                </label>
                                {(saldoEmbedThumbPreview || saldoConfig.deposit_panel.embed.thumbnail_url) && (
                                  <img
                                    src={saldoEmbedThumbPreview || saldoConfig.deposit_panel.embed.thumbnail_url || ""}
                                    alt="Preview"
                                    className="h-10 w-10 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleSection>
                      )}

                      {/* Content style fields */}
                      {saldoConfig.deposit_panel.message_style === "content" && (
                        <CollapsibleSection icon={FileText} title="Conteudo da Mensagem" description="Texto e imagem da mensagem" defaultOpen>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Conteudo</label>
                              <textarea
                                value={saldoConfig.deposit_panel.content.content}
                                onChange={(e) =>
                                  setSaldoConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          deposit_panel: {
                                            ...prev.deposit_panel,
                                            content: { ...prev.deposit_panel.content, content: e.target.value },
                                          },
                                        }
                                      : prev
                                  )
                                }
                                rows={3}
                                className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Imagem</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer">
                                  <Eye className="w-3.5 h-3.5" />
                                  Escolher arquivo
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(e) => handleSaldoImage("content_image", e)}
                                    className="hidden"
                                  />
                                </label>
                                {(saldoContentImagePreview || saldoConfig.deposit_panel.content.image_url) && (
                                  <img
                                    src={saldoContentImagePreview || saldoConfig.deposit_panel.content.image_url || ""}
                                    alt="Preview"
                                    className="h-10 w-10 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleSection>
                      )}

                      {/* Container style fields */}
                      {saldoConfig.deposit_panel.message_style === "container" && (
                        <CollapsibleSection icon={Boxes} title="Conteudo do Container" description="Texto, cor e imagens do container" defaultOpen>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-sm font-medium">Conteudo</label>
                              <textarea
                                value={saldoConfig.deposit_panel.container.content}
                                onChange={(e) =>
                                  setSaldoConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          deposit_panel: {
                                            ...prev.deposit_panel,
                                            container: { ...prev.deposit_panel.container, content: e.target.value },
                                          },
                                        }
                                      : prev
                                  )
                                }
                                rows={3}
                                className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Cor</label>
                              <ColorPicker
                                value={saldoConfig.deposit_panel.container.color}
                                onChange={(value) =>
                                  setSaldoConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          deposit_panel: {
                                            ...prev.deposit_panel,
                                            container: { ...prev.deposit_panel.container, color: value },
                                          },
                                        }
                                      : prev
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Imagem</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer">
                                  <Eye className="w-3.5 h-3.5" />
                                  Escolher arquivo
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(e) => handleSaldoImage("container_image", e)}
                                    className="hidden"
                                  />
                                </label>
                                {(saldoContainerImagePreview || saldoConfig.deposit_panel.container.image_url) && (
                                  <img
                                    src={saldoContainerImagePreview || saldoConfig.deposit_panel.container.image_url || ""}
                                    alt="Preview"
                                    className="h-10 w-10 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Thumbnail</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer">
                                  <Eye className="w-3.5 h-3.5" />
                                  Escolher arquivo
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(e) => handleSaldoImage("container_thumb", e)}
                                    className="hidden"
                                  />
                                </label>
                                {(saldoContainerThumbPreview || saldoConfig.deposit_panel.container.thumbnail_url) && (
                                  <img
                                    src={saldoContainerThumbPreview || saldoConfig.deposit_panel.container.thumbnail_url || ""}
                                    alt="Preview"
                                    className="h-10 w-10 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleSection>
                      )}

                      {/* Button config */}
                      <CollapsibleSection icon={QrCode} title="Botao" description="Texto, emoji e estilo do botao">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Texto do botao</label>
                            <input
                              type="text"
                              value={saldoConfig.deposit_panel.button.label}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_panel: {
                                          ...prev.deposit_panel,
                                          button: { ...prev.deposit_panel.button, label: e.target.value },
                                        },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Emoji</label>
                            <EmojiPicker
                              value={saldoConfig.deposit_panel.button.emoji || ""}
                              onChange={(value) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_panel: {
                                          ...prev.deposit_panel,
                                          button: { ...prev.deposit_panel.button, emoji: value },
                                        },
                                      }
                                    : prev
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Estilo do botao</label>
                            <GlassSelect
                              value={saldoConfig.deposit_panel.button.style}
                              onValueChange={(value) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_panel: {
                                          ...prev.deposit_panel,
                                          button: { ...prev.deposit_panel.button, style: value as any },
                                        },
                                      }
                                    : prev
                                )
                              }
                            >
                              <GlassSelectTrigger>
                                <GlassSelectValue placeholder="Selecione..." />
                              </GlassSelectTrigger>
                              <GlassSelectContent>
                                <GlassSelectItem value="green">Verde</GlassSelectItem>
                                <GlassSelectItem value="blue">Azul</GlassSelectItem>
                                <GlassSelectItem value="grey">Cinza</GlassSelectItem>
                                <GlassSelectItem value="red">Vermelho</GlassSelectItem>
                              </GlassSelectContent>
                            </GlassSelect>
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* Channel & send */}
                      <CollapsibleSection icon={Send} title="Enviar Painel" description="Selecione o canal e envie o painel" defaultOpen>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Canal do painel</label>
                            <GlassSelect
                              value={saldoConfig.deposit_panel.channel_id || ""}
                              onValueChange={(value) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_panel: { ...prev.deposit_panel, channel_id: value },
                                      }
                                    : prev
                                )
                              }
                            >
                              <GlassSelectTrigger>
                                <GlassSelectValue placeholder="Selecione um canal" />
                              </GlassSelectTrigger>
                              <GlassSelectContent>
                                {preferencesChannels.map((channel) => (
                                  <GlassSelectItem key={channel.id} value={channel.id}>
                                    #{channel.name}
                                  </GlassSelectItem>
                                ))}
                              </GlassSelectContent>
                            </GlassSelect>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria (ID)</label>
                            <input
                              type="text"
                              value={saldoConfig.deposit_panel.category_id || ""}
                              onChange={(e) =>
                                setSaldoConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        deposit_panel: { ...prev.deposit_panel, category_id: e.target.value },
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <GlassButton
                            size="sm"
                            variant="primary"
                            onClick={handleSendSaldoPanel}
                            disabled={!saldoConfig.deposit_panel.channel_id || saldoPanelSending}
                          >
                            <Send className="w-4 h-4" />
                            {saldoPanelSending ? "Enviando..." : "Enviar painel"}
                          </GlassButton>
                        </div>
                      </CollapsibleSection>

                      {/* Preview */}
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium">Preview</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          {saldoConfig.deposit_panel.message_style === "embed" && (
                            <div className="space-y-2">
                              <div className="text-sm font-semibold">{saldoConfig.deposit_panel.embed.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {saldoConfig.deposit_panel.embed.description}
                              </div>
                              <div className="flex gap-2 mt-2">
                                {(saldoEmbedPreview || saldoConfig.deposit_panel.embed.image_url) && (
                                  <img
                                    src={saldoEmbedPreview || saldoConfig.deposit_panel.embed.image_url || ""}
                                    alt="Imagem"
                                    className="h-20 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                                {(saldoEmbedThumbPreview || saldoConfig.deposit_panel.embed.thumbnail_url) && (
                                  <img
                                    src={saldoEmbedThumbPreview || saldoConfig.deposit_panel.embed.thumbnail_url || ""}
                                    alt="Thumbnail"
                                    className="h-20 w-20 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {saldoConfig.deposit_panel.message_style === "content" && (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">
                                {saldoConfig.deposit_panel.content.content}
                              </div>
                              {(saldoContentImagePreview || saldoConfig.deposit_panel.content.image_url) && (
                                <img
                                  src={saldoContentImagePreview || saldoConfig.deposit_panel.content.image_url || ""}
                                  alt="Imagem"
                                  className="h-20 rounded-lg object-cover border border-white/10"
                                />
                              )}
                            </div>
                          )}
                          {saldoConfig.deposit_panel.message_style === "container" && (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">
                                {saldoConfig.deposit_panel.container.content}
                              </div>
                              <div className="flex gap-2">
                                {(saldoContainerImagePreview || saldoConfig.deposit_panel.container.image_url) && (
                                  <img
                                    src={saldoContainerImagePreview || saldoConfig.deposit_panel.container.image_url || ""}
                                    alt="Imagem"
                                    className="h-20 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                                {(saldoContainerThumbPreview || saldoConfig.deposit_panel.container.thumbnail_url) && (
                                  <img
                                    src={saldoContainerThumbPreview || saldoConfig.deposit_panel.container.thumbnail_url || ""}
                                    alt="Thumbnail"
                                    className="h-20 w-20 rounded-lg object-cover border border-white/10"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save footer */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <GlassButton size="sm" variant="primary" onClick={handleSaldoSave} disabled={saldoSaving}>
                          {saldoSaving ? "Salvando..." : "Salvar Alteracoes"}
                        </GlassButton>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              {/* ── Admin ── */}
              <TabsContent value="saldo-admin">
                <GlassCard className="p-5" hover={false}>
                  <SectionHeader
                    title="Administracao de Saldo"
                    description="Adicione, remova ou transfira saldo manualmente para usuarios"
                  />
                  <div className="grid sm:grid-cols-3 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowSaldoAdd(true)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Adicionar saldo</p>
                        <p className="text-xs text-muted-foreground">Creditar saldo a um usuario</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaldoRemove(true)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <UserMinus className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Remover saldo</p>
                        <p className="text-xs text-muted-foreground">Debitar saldo de um usuario</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Transferir saldo</p>
                        <p className="text-xs text-muted-foreground">Em breve</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </TabsContent>

              {/* ── Users ── */}
              <TabsContent value="saldo-users">
                <GlassCard className="p-5" hover={false}>
                  <SectionHeader
                    title="Saldos dos Clientes"
                    description="Visualize os saldos, depositos e movimentacoes de cada cliente"
                  />
                  <div className="mt-2">
                    <DataTable
                      columns={[
                        {
                          key: "username",
                          header: "Cliente",
                          render: (row) => (
                            <div className="flex items-center gap-3">
                              {row.avatar ? (
                                <img
                                  src={row.avatar}
                                  alt={row.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                              )}
                              <span className="font-medium">{row.username}</span>
                            </div>
                          ),
                        },
                        {
                          key: "balance",
                          header: "Saldo",
                          render: (row) => (
                            <span className="font-medium text-emerald-400">
                              {formatCurrency(row.balance || 0)}
                            </span>
                          ),
                        },
                        {
                          key: "totalDeposited",
                          header: "Total Depositado",
                          render: (row) => <span className="font-medium">{formatCurrency(row.total_deposited || 0)}</span>,
                        },
                        {
                          key: "totalUsed",
                          header: "Total Usado",
                          render: (row) => <span className="font-medium">{formatCurrency(row.total_used || 0)}</span>,
                        },
                        {
                          key: "lastTx",
                          header: "Ultima Mov.",
                          render: (row) =>
                            row.last_transaction ? formatDate(new Date(row.last_transaction * 1000).toISOString()) : "---",
                        },
                      ]}
                      data={saldoUsers}
                      keyExtractor={(row) => row.id}
                      emptyMessage="Nenhum saldo encontrado"
                    />
                  </div>
                </GlassCard>
              </TabsContent>

              {/* ── Cashback ── */}
              <TabsContent value="cashback">
                <GlassCard className="p-5" hover={false}>
                  <SectionHeader
                    title="Cashback"
                    description="Configure o sistema de cashback para compras na loja"
                  />
                  {cashbackConfig && (
                    <div className="space-y-6 mt-2">
                      <SettingsRow
                        label="Cashback ativo"
                        description="Necessita sistema de saldo ativo"
                        control={
                          <Switch
                            checked={cashbackConfig.enabled}
                            onCheckedChange={(checked) =>
                              setCashbackConfig((prev) => (prev ? { ...prev, enabled: checked } : prev))
                            }
                          />
                        }
                      />

                      <CollapsibleSection icon={CreditCard} title="Configuracoes Gerais" description="Porcentagem padrao e limite maximo" defaultOpen>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Porcentagem padrao</label>
                            <input
                              type="number"
                              step="0.1"
                              value={cashbackConfig.default_percentage}
                              onChange={(e) =>
                                setCashbackConfig((prev) =>
                                  prev ? { ...prev, default_percentage: Number(e.target.value) } : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Cashback maximo (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={cashbackConfig.max_cashback ?? ""}
                              onChange={(e) =>
                                setCashbackConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        max_cashback: e.target.value ? Number(e.target.value) : null,
                                      }
                                    : prev
                                )
                              }
                              className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection icon={Users} title="Regras por Cargo" description="Multiplicadores de cashback por cargo">
                        <div className="space-y-3">
                          {cashbackConfig.rules.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                              <p className="text-sm text-muted-foreground">Nenhuma regra configurada.</p>
                              <p className="text-xs text-muted-foreground mt-1">Adicione cargos abaixo para criar multiplicadores de cashback.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {cashbackConfig.rules.map((rule) => (
                                <div
                                  key={rule.role_id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                      <Users className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium">{rule.role_name || rule.role_id}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-emerald-400">{rule.multiplier}x</span>
                                    <GlassButton
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setCashbackConfig((prev) =>
                                          prev
                                            ? { ...prev, rules: prev.rules.filter((r) => r.role_id !== rule.role_id) }
                                            : prev
                                        )
                                      }
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </GlassButton>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-3 border-t border-white/5">
                            <p className="text-xs text-muted-foreground mb-3">Adicionar novo cargo</p>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Cargo</label>
                                <GlassSelect value={cashbackRuleRoleId} onValueChange={setCashbackRuleRoleId}>
                                  <GlassSelectTrigger>
                                    <GlassSelectValue placeholder="Selecione um cargo" />
                                  </GlassSelectTrigger>
                                  <GlassSelectContent>
                                    {roles.map((role) => (
                                      <GlassSelectItem key={role.id} value={role.id}>
                                        {role.name}
                                      </GlassSelectItem>
                                    ))}
                                  </GlassSelectContent>
                                </GlassSelect>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Multiplicador</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={cashbackRuleMultiplier}
                                  onChange={(e) => setCashbackRuleMultiplier(e.target.value)}
                                  className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 outline-none focus:border-white/20 transition-colors"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <GlassButton
                                size="sm"
                                onClick={() => {
                                  const role = roles.find((r) => r.id === cashbackRuleRoleId);
                                  if (!role) return;
                                  const multiplier = Number(cashbackRuleMultiplier || 1);
                                  setCashbackConfig((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          rules: [
                                            ...prev.rules.filter((r) => r.role_id !== role.id),
                                            { role_id: role.id, role_name: role.name, multiplier },
                                          ],
                                        }
                                      : prev
                                  );
                                  setCashbackRuleRoleId("");
                                  setCashbackRuleMultiplier("1");
                                }}
                                disabled={!cashbackRuleRoleId}
                              >
                                <Plus className="w-4 h-4" />
                                Adicionar cargo
                              </GlassButton>
                            </div>
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* Save footer */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <GlassButton size="sm" variant="primary" onClick={handleCashbackSave} disabled={cashbackSaving}>
                          {cashbackSaving ? "Salvando..." : "Salvar Cashback"}
                        </GlassButton>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      <Modal
        isOpen={showSaldoAdd}
        onClose={() => setShowSaldoAdd(false)}
        title="Adicionar saldo"
        description="Adicionar saldo manualmente para um usuário"
        size="md"
      >
        <form className="space-y-4" onSubmit={handleSaldoAdminAdd}>
          <div>
            <label className="text-sm font-medium mb-2 block">ID do usuário</label>
            <input
              type="text"
              value={saldoAddUserId}
              onChange={(e) => setSaldoAddUserId(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={saldoAddAmount}
              onChange={(e) => setSaldoAddAmount(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Bônus (R$)</label>
            <input
              type="number"
              step="0.01"
              value={saldoAddBonus}
              onChange={(e) => setSaldoAddBonus(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Método</label>
            <input
              type="text"
              value={saldoAddMethod}
              onChange={(e) => setSaldoAddMethod(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2">
            <GlassButton variant="ghost" type="button" onClick={() => setShowSaldoAdd(false)}>
              Cancelar
            </GlassButton>
            <GlassButton type="submit" disabled={saldoActionLoading}>
              {saldoActionLoading ? "Salvando..." : "Adicionar"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSaldoRemove}
        onClose={() => setShowSaldoRemove(false)}
        title="Remover saldo"
        description="Remover saldo manualmente de um usuário"
        size="md"
      >
        <form className="space-y-4" onSubmit={handleSaldoAdminRemove}>
          <div>
            <label className="text-sm font-medium mb-2 block">ID do usuário</label>
            <input
              type="text"
              value={saldoRemoveUserId}
              onChange={(e) => setSaldoRemoveUserId(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={saldoRemoveAmount}
              onChange={(e) => setSaldoRemoveAmount(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Motivo</label>
            <input
              type="text"
              value={saldoRemoveReason}
              onChange={(e) => setSaldoRemoveReason(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2">
            <GlassButton variant="ghost" type="button" onClick={() => setShowSaldoRemove(false)}>
              Cancelar
            </GlassButton>
            <GlassButton type="submit" disabled={saldoActionLoading}>
              {saldoActionLoading ? "Salvando..." : "Remover"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Enviar Produto"
        description={editingProduct ? `Enviar ${editingProduct.name} para um canal` : ""}
        size="md"
      >
        <form className="space-y-5" onSubmit={handleSendProduct}>
          <div>
            <label className="text-sm font-medium mb-2 block">Canal</label>
            <GlassSelect value={sendChannelId} onValueChange={setSendChannelId}>
              <GlassSelectTrigger className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors">
                <GlassSelectValue placeholder="Selecione um canal" />
              </GlassSelectTrigger>
              <GlassSelectContent>
                {channels.map((channel) => (
                  <GlassSelectItem key={channel.id} value={channel.id}>
                    #{channel.name}
                  </GlassSelectItem>
                ))}
              </GlassSelectContent>
            </GlassSelect>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Modo</label>
              <GlassSelect value={sendMode} onValueChange={setSendMode}>
                <GlassSelectTrigger className="w-full px-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors">
                  <GlassSelectValue />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="legacy">Legacy</GlassSelectItem>
                  <GlassSelectItem value="container_outside">Container (Imagem fora)</GlassSelectItem>
                  <GlassSelectItem value="container_inside">Container (Imagem dentro)</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>
            <div className="flex items-center gap-3 pt-8">
              <Switch checked={sendDescFormatted} onCheckedChange={setSendDescFormatted} />
              <span className="text-sm">Descrição formatada</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <GlassButton variant="ghost" onClick={() => setShowSendModal(false)} type="button">
              Cancelar
            </GlassButton>
            <GlassButton variant="primary" type="submit" disabled={!sendChannelId || sending} loading={sending}>
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (deleting) return;
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir produto"
        description={
          deleteTarget
            ? `Tem certeza que deseja excluir ${deleteTarget.name}? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir este produto?"
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
