/**
 * Main React application with a Material UI-driven design system.
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from "react";
import { ColorModeContext } from "./main.jsx";
import {
  Routes,
  Route,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  CircularProgress,
  FormControlLabel,
} from "@mui/material";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InsightsIcon from "@mui/icons-material/Insights";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BoltIcon from "@mui/icons-material/Bolt";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DashboardPage from "./DashboardPage";

const STATUS_OPTIONS = [
  { value: "awaiting_review", label: "Awaiting Review" },
  { value: "in_review", label: "In Review" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "cleared", label: "Cleared" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "status", label: "Status" },
  { value: "score_desc", label: "Probability high-low" },
];

const OWNER_PRESETS = [
  "",
  "Quality",
  "Maintenance",
  "Reliability",
  "Production",
  "Supplier Quality",
];

const STATUS_TOKENS = {
  awaiting_review: { bg: "#fef3c7", fg: "#92400e" },
  in_review: { bg: "#dbeafe", fg: "#1d4ed8" },
  needs_attention: { bg: "#fee2e2", fg: "#991b1b" },
  cleared: { bg: "#dcfce7", fg: "#166534" },
  default: { bg: "#e0e7ff", fg: "#1e1b4b" },
};

const getStatusLabel = (value) =>
  STATUS_OPTIONS.find((option) => option.value === value)?.label || value;

const formatTimestamp = (seconds) =>
  new Date(seconds * 1000).toLocaleString();

const StatusChip = ({ status }) => {
  const palette = STATUS_TOKENS[status] || STATUS_TOKENS.default;
  return (
    <Chip
      label={getStatusLabel(status)}
      size="small"
      sx={{
        backgroundColor: palette.bg,
        color: palette.fg,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    />
  );
};

const NavBar = () => {
  const location = useLocation();
  const colorMode = useContext(ColorModeContext);
  const tabs = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Predict", path: "/predict" },
    { label: "Inventory", path: "/inventory" },
  ];
  const currentTab =
    tabs.find((tab) => tab.path !== "/" && location.pathname.startsWith(tab.path))
      ?.path || "/";

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ mb: 2 }}>
      <Toolbar sx={{ gap: 2 }}>
        <PrecisionManufacturingIcon fontSize="large" color="primary" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div">
            DL4SE Industrial Inspector
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI-assisted quality console for ball screw drives
          </Typography>
        </Box>
        <Tabs
          value={currentTab}
          textColor="primary"
          indicatorColor="secondary"
          sx={{ minHeight: 48 }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.path}
              label={tab.label}
              value={tab.path}
              component={RouterLink}
              to={tab.path}
            />
          ))}
        </Tabs>
        <IconButton
          onClick={colorMode.toggleColorMode}
          color="inherit"
          aria-label="Toggle dark mode"
          sx={{ ml: 1 }}
        >
          {colorMode.mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

const LandingPage = () => (
  <Container maxWidth="lg" sx={{ py: 6 }}>
    <Grid container spacing={4} alignItems="center">
      <Grid item xs={12} md={6}>
        <Stack spacing={3}>
          <Typography variant="h3" component="h1">
            Precision-grade defect detection built for the factory floor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A ConvNeXt-Tiny model powers instant defect scoring on every lot. The
            operations console lets your quality, maintenance, and supplier teams
            collaborate in one place with AI-driven recommendations.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/predict"
              startIcon={<AutoFixHighIcon />}
            >
              Run a single prediction
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/inventory"
              startIcon={<Inventory2Icon />}
            >
              Open inventory manager
            </Button>
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: 4, border: 1, borderColor: "divider" }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              What&apos;s included
            </Typography>
            <List>
              {[
                "ConvNeXt-Tiny inference running on CPU",
                "FastAPI backend with persistent inventory",
                "AI recommendations for triage workflows",
                "Responsive Material Design UI",
              ].map((feature) => (
                <ListItem key={feature} disableGutters>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
);

const PredictPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    setResult(null);
    if (!nextFile) {
      setFile(null);
      setPreview("");
      return;
    }
    setFile(nextFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result.toString());
    reader.readAsDataURL(nextFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select an image before predicting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      const [, payload] = base64.toString().split(",");

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: payload }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 4 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Workflow
              </Typography>
              <List dense>
                {[
                  "Upload a PNG or JPEG sample",
                  "ConvNeXt generates a defect probability",
                  "Use the result to triage or log",
                ].map((step) => (
                  <ListItem key={step} disableGutters>
                    <ListItemIcon>
                      <BoltIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
            <Stack component="form" spacing={3} onSubmit={handleSubmit}>
              <Typography variant="h5">Send an image</Typography>
              <Typography variant="body2" color="text.secondary">
                The model runs entirely on CPU, so you can test predictions from any
                laptop without GPU drivers.
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? "Change image" : "Select image"}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={<AutoFixHighIcon />}
                >
                  {isSubmitting ? "Classifying..." : "Predict"}
                </Button>
              </Stack>
              {isSubmitting && <LinearProgress />}
              {preview && (
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3, overflow: "hidden" }}
                >
                  <img
                    src={preview}
                    alt="Selected sample"
                    style={{ width: "100%", maxHeight: 320, objectFit: "contain" }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Preview of the uploaded image
                    </Typography>
                  </CardContent>
                </Card>
              )}
              {error && <Alert severity="error">{error}</Alert>}
              {result && (
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3, bgcolor: "action.hover" }}
                >
                  <CardContent>
                    <Typography variant="h6">Prediction</Typography>
                    <Typography variant="body1" sx={{ fontSize: "1.4rem", fontWeight: 600 }}>
                      Probability (has defect): {result.score.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Label: {result.label === 1 ? "Has defect" : "No defect"}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

const InventoryPage = () => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [activeItemId, setActiveItemId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sort: "created_desc",
  });
  const [batchForm, setBatchForm] = useState({
    status: "",
    owner: "",
    notes: "",
    appendNotes: true,
  });
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = useCallback((severity, message) => {
    setSnackbar({ open: true, severity, message });
  }, []);

  const handleToastClose = useCallback((_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      showToast("error", err.message || "Failed to load inventory");
    }
  }, [showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (!prev.size) return prev;
      const next = new Set();
      items.forEach((item) => {
        if (prev.has(item.id)) next.add(item.id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  useEffect(() => {
    if (selectedIds.size === 0 && aiInsights.length) {
      setAiInsights([]);
    }
  }, [selectedIds, aiInsights.length]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeItemId) || null,
    [items, activeItemId]
  );

  useEffect(() => {
    if (activeItem) {
      setEditDraft({
        name: activeItem.name,
        status: activeItem.status,
        owner: activeItem.owner || "",
        notes: activeItem.notes || "",
      });
    } else {
      setEditDraft(null);
    }
  }, [activeItem]);

  const processedItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesStatus = filters.status === "all" || item.status === filters.status;
      const haystack = `${item.name} ${item.owner || ""} ${item.notes || ""}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesStatus && matchesSearch;
    });
    const sorted = [...filtered];
    switch (filters.sort) {
      case "created_asc":
        sorted.sort((a, b) => a.created_at - b.created_at);
        break;
      case "status":
        sorted.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
        break;
      case "score_desc":
        sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        break;
      default:
        sorted.sort((a, b) => b.created_at - a.created_at);
    }
    return sorted;
  }, [items, filters]);

  const summary = useMemo(() => {
    const base = {
      total: items.length,
      awaitingReview: 0,
      inReview: 0,
      needsAttention: 0,
      cleared: 0,
      avgScore: 0,
    };
    if (!items.length) {
      return base;
    }
    const stats = items.reduce(
      (acc, item) => {
        if (item.status === "awaiting_review") acc.awaitingReview += 1;
        if (item.status === "in_review") acc.inReview += 1;
        if (item.status === "needs_attention") acc.needsAttention += 1;
        if (item.status === "cleared") acc.cleared += 1;
        if (typeof item.score === "number") {
          acc.scored += 1;
          acc.sumScore += item.score;
        }
        return acc;
      },
      { awaitingReview: 0, inReview: 0, needsAttention: 0, cleared: 0, scored: 0, sumScore: 0 }
    );
    return {
      total: items.length,
      awaitingReview: stats.awaitingReview,
      inReview: stats.inReview,
      needsAttention: stats.needsAttention,
      cleared: stats.cleared,
      avgScore: stats.scored ? stats.sumScore / stats.scored : 0,
    };
  }, [items]);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpload = async () => {
    if (!files.length) {
      showToast("warning", "Select one or more images to upload.");
      return;
    }
    setLoading(true);
    try {
      const payloadItems = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const [, base64] = reader.result.toString().split(",");
                resolve({ image_base64: base64, name: file.name });
              };
              reader.onerror = () => reject(new Error("Failed to read file."));
              reader.readAsDataURL(file);
            })
        )
      );

      const res = await fetch("/api/inventory/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Upload failed");
      }

      const data = await res.json();
      setItems(data);
      setFiles([]);
      setSelectedIds(new Set());
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("success", `Uploaded ${payloadItems.length} item(s).`);
      handleClassify({ autoTriggered: true });
    } catch (err) {
      showToast("error", err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = useCallback(
    async ({ autoTriggered = false } = {}) => {
      setClassifying(true);
      try {
        const res = await fetch("/api/inventory/classify", { method: "POST" });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.detail || "Classification failed");
        }
        const data = await res.json();
        setItems(data);
        const successMessage = autoTriggered
          ? "Auto-classification finished for the latest uploads."
          : "Classification completed across the current inventory.";
        showToast("success", successMessage);
      } catch (err) {
        showToast("error", err.message || "Classification failed");
      } finally {
        setClassifying(false);
      }
    },
    [showToast]
  );

  const patchItem = useCallback(
    async (itemId, changes, options = {}) => {
      const payload = { ...changes };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });
      if (!Object.keys(payload).length) {
        return null;
      }
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Update failed");
      }
      const updated = await res.json();
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      if (options.successMessage) {
        showToast("success", options.successMessage);
      }
      return updated;
    },
    [showToast]
  );

  const handleQuickStatusChange = async (item, nextStatus) => {
    if (nextStatus === item.status) return;
    try {
      await patchItem(item.id, { status: nextStatus }, {
        successMessage: `Updated status for ${item.name}.`,
      });
    } catch (err) {
      showToast("error", err.message || "Failed to update status");
    }
  };

  const selectionCount = selectedIds.size;
  const hasSelection = selectionCount > 0;
  const allVisibleSelected =
    processedItems.length > 0 &&
    processedItems.every((item) => selectedIds.has(item.id));

  const handleBatchApply = async () => {
    if (!hasSelection) {
      showToast("warning", "Select at least one item to run a batch update.");
      return;
    }
    if (!batchForm.status && !batchForm.owner && !batchForm.notes.trim()) {
      showToast(
        "warning",
        "Provide at least one field to update in the batch form."
      );
      return;
    }
    try {
      const payload = { item_ids: Array.from(selectedIds) };
      if (batchForm.status) payload.status = batchForm.status;
      if (batchForm.owner) payload.owner = batchForm.owner;
      const trimmedNotes = batchForm.notes.trim();
      if (trimmedNotes) {
        payload.notes = trimmedNotes;
        payload.append_notes = batchForm.appendNotes;
      }
      const res = await fetch("/api/inventory/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Batch update failed");
      }
      const data = await res.json();
      setItems(data);
      setSelectedIds(new Set());
      setBatchForm({ status: "", owner: "", notes: "", appendNotes: true });
      showToast("success", "Batch update applied successfully.");
    } catch (err) {
      showToast("error", err.message || "Batch update failed");
    }
  };

  const handleAIInsights = async () => {
    if (!hasSelection) {
      showToast("warning", "Select items to request AI recommendations.");
      return;
    }
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/inventory/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "AI insights request failed");
      }
      const data = await res.json();
      setAiInsights(data.insights || []);
      if (data.missing && data.missing.length) {
        showToast(
          "warning",
          `Some items were not found: ${data.missing.join(", ")}`
        );
      } else {
        showToast("success", "AI recommendations ready for your selection.");
      }
    } catch (err) {
      setAiInsights([]);
      showToast("error", err.message || "Unable to retrieve AI insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const applyInsight = async (insight) => {
    try {
      await patchItem(
        insight.item_id,
        {
          status: insight.recommended_status,
          owner: insight.owner_hint,
          notes: insight.suggested_note,
          append_notes: true,
        },
        { successMessage: `Applied AI plan to ${insight.name}.` }
      );
    } catch (err) {
      showToast("error", err.message || "Failed to apply AI recommendation");
    }
  };

  const toggleSelection = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(processedItems.map((item) => item.id)));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditDraftChange = (field, value) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleActiveItemSave = async () => {
    if (!activeItem || !editDraft) return;
    const payload = {};
    const trimmedName = editDraft.name.trim();
    if (trimmedName && trimmedName !== activeItem.name) payload.name = trimmedName;
    if (editDraft.status && editDraft.status !== activeItem.status)
      payload.status = editDraft.status;
    if (editDraft.owner !== (activeItem.owner || ""))
      payload.owner = editDraft.owner;
    if ((editDraft.notes || "") !== (activeItem.notes || ""))
      payload.notes = editDraft.notes;
    if (!Object.keys(payload).length) {
      showToast("info", "No changes detected for this item.");
      return;
    }
    try {
      const updated = await patchItem(activeItem.id, payload, {
        successMessage: `Updated ${activeItem.name}.`,
      });
      if (updated) {
        setEditDraft({
          name: updated.name,
          status: updated.status,
          owner: updated.owner || "",
          notes: updated.notes || "",
        });
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update the item");
    }
  };

  const closeDialog = () => {
    setActiveItemId(null);
    setEditDraft(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Inventory manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage production lots, capture analyst notes, and let the AI model
            spotlight the parts that need urgent attention.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {[
            { label: "Total lots", value: summary.total },
            { label: "Needs attention", value: summary.needsAttention },
            { label: "Awaiting review", value: summary.awaitingReview },
            { label: "In review", value: summary.inReview },
            { label: "Cleared", value: summary.cleared },
            { label: "Avg defect prob", value: summary.avgScore.toFixed(3) },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e4e7ec" }}>
                <Typography variant="overline" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h4">{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e4e7ec" }}>
          <Stack spacing={2}>
            <Typography variant="h6">Upload new images</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/png, image/jpeg"
                multiple
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                {files.length ? "Add more images" : "Select images"}
              </Button>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <CloudUploadIcon />
                  )
                }
              >
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </Stack>

            {files.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {files.map((file, idx) => (
                  <Chip
                    key={`${file.name}-${idx}`}
                    label={file.name}
                    onDelete={() => handleRemoveFile(idx)}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e4e7ec" }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Search"
                placeholder="Lot ID, owner, notes"
                value={filters.search}
                onChange={(event) => handleFilterChange("search", event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status filter</InputLabel>
                <Select
                  label="Status filter"
                  value={filters.status}
                  onChange={(event) => handleFilterChange("status", event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  label="Sort by"
                  value={filters.sort}
                  onChange={(event) => handleFilterChange("sort", event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {hasSelection && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e4e7ec" }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Batch operations
                </Typography>
                <Chip
                  label={`${selectionCount} selected`}
                  color="primary"
                />
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Set new status</InputLabel>
                    <Select
                      label="Set new status"
                      value={batchForm.status}
                      onChange={(event) =>
                        setBatchForm((prev) => ({ ...prev, status: event.target.value }))
                      }
                    >
                      <MenuItem value="">Keep as-is</MenuItem>
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Assign owner</InputLabel>
                    <Select
                      label="Assign owner"
                      value={batchForm.owner}
                      onChange={(event) =>
                        setBatchForm((prev) => ({ ...prev, owner: event.target.value }))
                      }
                    >
                      {OWNER_PRESETS.map((owner) => (
                        <MenuItem key={owner || "unassigned"} value={owner}>
                          {owner || "Unassigned"}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Notes"
                    multiline
                    minRows={2}
                    value={batchForm.notes}
                    placeholder="Inspection plan, containment action, etc."
                    onChange={(event) =>
                      setBatchForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={batchForm.appendNotes}
                        onChange={(event) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            appendNotes: event.target.checked,
                          }))
                        }
                        disabled={!batchForm.notes.trim()}
                      />
                    }
                    label="Append notes instead of replacing"
                  />
                </Grid>
              </Grid>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={handleBatchApply}
                  disabled={!hasSelection}
                  startIcon={<ManageAccountsIcon />}
                >
                  Apply batch update
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleAIInsights}
                  disabled={!hasSelection || insightsLoading}
                  startIcon={
                    insightsLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <InsightsIcon />
                    )
                  }
                >
                  {insightsLoading ? "Analyzing..." : "Get AI recommendations"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {aiInsights.length > 0 && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e4e7ec" }}>
            <Typography variant="h6" gutterBottom>
              AI recommendations
            </Typography>
            <Grid container spacing={2}>
              {aiInsights.map((insight) => (
                <Grid item xs={12} md={4} key={insight.item_id}>
                  <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1">{insight.name}</Typography>
                        <StatusChip status={insight.recommended_status} />
                        <Typography variant="body2" color="text.secondary">
                          Confidence: {insight.confidence ?? "--"}
                        </Typography>
                        <Typography variant="body2">{insight.summary}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Route to: {insight.owner_hint || "Unassigned"}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => applyInsight(insight)}>
                        Apply recommendation
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e4e7ec" }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Items
            </Typography>
            {processedItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No items match the current filters.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={allVisibleSelected}
                          onChange={(event) => toggleSelectAll(event.target.checked)}
                          indeterminate={
                            hasSelection && !allVisibleSelected
                          }
                        />
                      </TableCell>
                      <TableCell>Preview</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Prob (defect)</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Avatar
                            variant="rounded"
                            src={item.image_path}
                            alt={item.name}
                            sx={{ width: 72, height: 72, borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Owner: {item.owner || "Unassigned"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {item.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={1}>
                            <StatusChip status={item.status} />
                            <FormControl size="small">
                              <Select
                                value={item.status}
                                onChange={(event) =>
                                  handleQuickStatusChange(item, event.target.value)
                                }
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {typeof item.score === "number"
                            ? item.score.toFixed(3)
                            : "--"}
                        </TableCell>
                        <TableCell>{formatTimestamp(item.created_at)}</TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          {item.notes
                            ? item.notes.length > 90
                              ? `${item.notes.slice(0, 90)}...`
                              : item.notes
                            : "--"}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setActiveItemId(item.id)}
                          >
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        {activeItem && editDraft && (
          <Dialog open onClose={closeDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {activeItem.name}
              <IconButton
                aria-label="close"
                onClick={closeDialog}
                sx={{ position: "absolute", right: 16, top: 16 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <StatusChip status={activeItem.status} />
                  <Typography variant="body2" color="text.secondary">
                    Owner: {activeItem.owner || "Unassigned"}
                  </Typography>
                </Stack>
                {typeof activeItem.score === "number" && (
                  <Typography variant="body2">
                    Probability (has defect): {activeItem.score.toFixed(4)}
                  </Typography>
                )}
                {typeof activeItem.label === "number" && (
                  <Typography variant="body2">
                    Label: {activeItem.label === 1 ? "Has defect" : "No defect"}
                  </Typography>
                )}
                <Typography variant="body2">
                  Created: {formatTimestamp(activeItem.created_at)}
                </Typography>
                {activeItem.notes && (
                  <Typography variant="body2">Notes: {activeItem.notes}</Typography>
                )}
                <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e4e7ec" }}>
                  <img
                    src={activeItem.image_path}
                    alt={activeItem.name}
                    style={{ width: "100%", maxHeight: 320, objectFit: "contain" }}
                  />
                </Box>
                <Divider />
                <TextField
                  label="Name"
                  value={editDraft.name}
                  onChange={(event) => handleEditDraftChange("name", event.target.value)}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={editDraft.status}
                    onChange={(event) => handleEditDraftChange("status", event.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Owner</InputLabel>
                  <Select
                    label="Owner"
                    value={editDraft.owner}
                    onChange={(event) => handleEditDraftChange("owner", event.target.value)}
                  >
                    {OWNER_PRESETS.map((owner) => (
                      <MenuItem key={owner || "unassigned"} value={owner}>
                        {owner || "Unassigned"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Notes"
                  multiline
                  minRows={3}
                  value={editDraft.notes}
                  onChange={(event) => handleEditDraftChange("notes", event.target.value)}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button variant="contained" onClick={handleActiveItemSave}>
                Save changes
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleToastClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const App = () => (
  <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
    <NavBar />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/predict" element={<PredictPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
    </Routes>
  </Box>
);

export default App;
