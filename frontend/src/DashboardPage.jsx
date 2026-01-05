import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  Stack,
  Alert
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import InsightsIcon from '@mui/icons-material/Insights';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Matches STATUS_TOKENS in App.jsx roughly
const STATUS_COLORS = {
  awaiting_review: '#f59e0b', // amber
  in_review: '#3b82f6',      // blue
  needs_attention: '#ef4444', // red
  cleared: '#22c55e',        // green
  default: '#64748b'
};

const DashboardPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("Failed to load inventory data");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const metrics = useMemo(() => {
    if (!items.length) return null;

    const total = items.length;
    const withDefect = items.filter(i => (i.score || 0) > 0.5).length;
    const defectRate = ((withDefect / total) * 100).toFixed(1);
    
    // Status counts for Pie Chart
    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      color: STATUS_COLORS[name] || STATUS_COLORS.default
    }));

    // Owner workload for Bar Chart
    const ownerCounts = items.reduce((acc, item) => {
      const owner = item.owner || 'Unassigned';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {});

    const barData = Object.entries(ownerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 owners

    // Timeline data (simulated by created_at)
    // Group by day
    const timeSeries = items.reduce((acc, item) => {
      const date = new Date(item.created_at * 1000).toLocaleDateString();
      if (!acc[date]) acc[date] = { date, count: 0, highRisk: 0 };
      acc[date].count += 1;
      if ((item.score || 0) > 0.8) acc[date].highRisk += 1;
      return acc;
    }, {});
    
    const lineData = Object.values(timeSeries)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return { total, defectRate, pieData, barData, lineData };
  }, [items]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Error loading dashboard: {error}</Alert>
      </Container>
    );
  }

  if (!metrics) {
      return (
          <Container maxWidth="lg" sx={{ mt: 4 }}>
             <Typography>No data available for dashboard.</Typography>
          </Container>
      )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Analytics Dashboard
            </Typography>
            <Typography color="text.secondary">
                Real-time overview of quality inspections and team workload.
            </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <SummaryCard 
              title="Total Inspections" 
              value={metrics.total} 
              icon={<AssignmentIcon />} 
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SummaryCard 
              title="Defect Rate" 
              value={`${metrics.defectRate}%`} 
              icon={<WarningAmberIcon />} 
              color={theme.palette.error.main}
              helpText="Items with defect score > 0.5"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SummaryCard 
              title="Cleared Items" 
              value={metrics.pieData.find(d => d.name === 'cleared')?.value || 0} 
              icon={<CheckCircleOutlineIcon />} 
              color={theme.palette.success.main}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
            {/* Status Distribution */}
             <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Status Distribution</Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metrics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Owner Workload */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Workload by Owner</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.barData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="count" fill={theme.palette.secondary.main} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

           {/* Inspection Trend */}
           <Grid item xs={12}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inspection Activity Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.lineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} strokeWidth={2} name="Uploads" />
                      <Line type="monotone" dataKey="highRisk" stroke={theme.palette.error.main} strokeWidth={2} name="High Risk Defects" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
};

const SummaryCard = ({ title, value, icon, color, helpText }) => (
  <Card sx={{ height: '100%', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}15`, color: color, display: 'flex' }}>
            {icon}
        </Box>
        <Box>
            <Typography color="text.secondary" variant="body2" fontWeight={600}>
                {title.toUpperCase()}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
                {value}
            </Typography>
            {helpText && <Typography variant="caption" color="text.secondary">{helpText}</Typography>}
        </Box>
    </CardContent>
  </Card>
);

export default DashboardPage;
