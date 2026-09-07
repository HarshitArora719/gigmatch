import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

interface DashboardData {
  // Raw data
  orders: any[];
  gigs: any[];
  proposals: any[];
  reviews: any[];

  // Computed stats — Client
  totalGigsPosted: number;
  activeGigs: number;
  totalProposalsReceived: number;
  activeOrders: number;
  completedOrders: number;

  // Computed stats — Freelancer
  totalProposalsSent: number;
  acceptedProposals: number;
  reviewsReceived: number;

  // Computed financial
  totalSpending: number;
  pendingPayments: number;
  completedPayments: number;

  // State
  loading: boolean;
  error: string | null;
}

export function useDashboardData(user: { id: string; role: string } | null) {
  const [data, setData] = useState<DashboardData>({
    orders: [],
    gigs: [],
    proposals: [],
    reviews: [],
    totalGigsPosted: 0,
    activeGigs: 0,
    totalProposalsReceived: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalProposalsSent: 0,
    acceptedProposals: 0,
    reviewsReceived: 0,
    totalSpending: 0,
    pendingPayments: 0,
    completedPayments: 0,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const promises: Promise<any>[] = [
        api.get('/api/orders/my-orders').catch(() => ({ data: { data: { orders: [] } } })),
        api.get('/api/reviews/my-reviews').catch(() => ({ data: { data: { reviews: [] } } })),
        api.get('/api/gigs/my-gigs').catch(() => ({ data: { data: { gigs: [] } } })),
      ];

      if (user.role === 'client') {
        promises.push(
          api.get('/api/proposals/my-gigs-proposals').catch(() => ({ data: { data: { proposals: [] } } }))
        );
      } else {
        // Freelancer
        promises.push(
          api.get('/api/proposals/my-proposals').catch(() => ({ data: { data: { proposals: [] } } }))
        );
      }

      const results = await Promise.all(promises);

      const orders = results[0]?.data?.data?.orders || [];
      const reviews = results[1]?.data?.data?.reviews || [];
      const gigs = results[2]?.data?.data?.gigs || [];
      const proposals = results[3]?.data?.data?.proposals || [];

      // Compute stats
      const activeOrders = orders.filter((o: any) => o.status === 'active').length;
      const completedOrders = orders.filter((o: any) => o.status === 'completed').length;

      // Client stats
      const totalGigsPosted = gigs.length;
      const activeGigs = gigs.filter((g: any) => g.status === 'open').length;
      const totalProposalsReceived = proposals.length;

      // Freelancer stats
      const totalProposalsSent = user.role === 'freelancer' ? proposals.length : 0;
      const acceptedProposals = user.role === 'freelancer'
        ? proposals.filter((p: any) => p.status === 'accepted').length
        : 0;
      const reviewsReceived = reviews.filter((r: any) => r.to?._id === user.id || r.to === user.id).length;

      // Financial computations from orders
      const totalSpending = orders.reduce((sum: number, o: any) => {
        if (o.status !== 'cancelled') sum += (o.totalAmount || 0);
        return sum;
      }, 0);

      const pendingPayments = orders.reduce((sum: number, o: any) => {
        if (o.status === 'active' && o.milestones) {
          o.milestones.forEach((m: any) => {
            if (m.status === 'pending') sum += (m.amount || 0);
          });
        }
        return sum;
      }, 0);

      const completedPayments = orders.reduce((sum: number, o: any) => {
        if (o.milestones) {
          o.milestones.forEach((m: any) => {
            if (m.status === 'paid' || m.status === 'approved') sum += (m.amount || 0);
          });
        }
        return sum;
      }, 0);

      setData({
        orders,
        gigs,
        proposals,
        reviews,
        totalGigsPosted,
        activeGigs,
        totalProposalsReceived,
        activeOrders,
        completedOrders,
        totalProposalsSent,
        acceptedProposals,
        reviewsReceived,
        totalSpending,
        pendingPayments,
        completedPayments,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to load dashboard data',
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refetch: fetchData };
}
