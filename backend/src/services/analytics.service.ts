import prisma from '../config/prisma';
import { MandapamPaymentStatus, VerificationStatus, Gender, District } from '@prisma/client';

export const getRevenueAnalytics = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [mandapamRevenue, matrimonyRevenue, mandapamTrend, matrimonyTrend] = await Promise.all([
        prisma.mandapamBooking.aggregate({
            _sum: { totalAmount: true },
            where: {
                paymentStatus: { in: [MandapamPaymentStatus.ADVANCE, MandapamPaymentStatus.FULLY_PAID] }
            }
        }),
        prisma.planTransaction.aggregate({
            _sum: { amount: true }
        }),
        prisma.mandapamBooking.findMany({
            where: { date: { gte: sixMonthsAgo } },
            select: { date: true, totalAmount: true, paymentStatus: true }
        }),
        prisma.planTransaction.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, amount: true }
        })
    ]);

    return {
        highlights: {
            mandapam: Number(mandapamRevenue._sum.totalAmount || 0),
            matrimony: Number(matrimonyRevenue._sum.amount || 0),
            total: Number(mandapamRevenue._sum.totalAmount || 0) + Number(matrimonyRevenue._sum.amount || 0)
        },
        trends: {
            mandapam: mandapamTrend,
            matrimony: matrimonyTrend
        }
    };
};

export const getMandapamAnalytics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completed, upcoming] = await Promise.all([
        prisma.mandapamBooking.count({ where: { date: { lt: today } } }),
        prisma.mandapamBooking.count({ where: { date: { gte: today } } })
    ]);

    const total = completed + upcoming;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendRaw = await prisma.mandapamBooking.groupBy({
        by: ['date'],
        _count: { _all: true },
        where: { date: { gte: sixMonthsAgo } },
        orderBy: { date: 'asc' }
    });

    const trend = trendRaw.map(t => ({
        date: t.date.toISOString().split('T')[0],
        count: t._count._all
    }));

    const totalBlockedDays = await prisma.blockedDate.count();
    const slots_utilization = [
        { label: 'Booked', count: total },
        { label: 'Blocked', count: totalBlockedDays * 2 }
    ];

    return {
        total,
        completed,
        upcoming,
        cancelled: 0,
        trend,
        slots_utilization
    };
};

export const getMatrimonyAnalytics = async () => {
    const today = new Date();

    const [total, verified, pending] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({ where: { adminVerified: VerificationStatus.ACCEPTED } }),
        prisma.profile.count({ where: { adminVerified: VerificationStatus.PENDING } })
    ]);

    return {
        total,
        verified,
        pending
    };
};

export const getPackagePerformance = async () => {
    const packages = await prisma.mandapamPackage.findMany({
        take: 50,
        include: {
            _count: { select: { bookings: true } },
            bookings: { select: { totalAmount: true } }
        }
    });

    return {
        distribution: packages.map(pkg => ({
            id: pkg.id,
            label: pkg.nameEn,
            nameEn: pkg.nameEn,
            nameTa: pkg.nameTa,
            count: pkg._count.bookings,
            revenue: pkg.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
        }))
    };
};

export const getFunnelAnalytics = async () => {
    const today = new Date();

    const [totalBookings, paymentStarted, fullyPaid, completedEvents, totalUsers, totalProfiles, verifiedProfiles] = await Promise.all([
        prisma.mandapamBooking.count(),
        prisma.mandapamBooking.count({ where: { paymentStatus: { not: MandapamPaymentStatus.NOT_PAID } } }),
        prisma.mandapamBooking.count({ where: { paymentStatus: MandapamPaymentStatus.FULLY_PAID } }),
        prisma.mandapamBooking.count({ where: { date: { lt: today } } }),
        prisma.user.count(),
        prisma.profile.count(),
        prisma.profile.count({ where: { adminVerified: VerificationStatus.ACCEPTED } })
    ]);

    return {
        booking: [
            { label: 'Booking Created', count: totalBookings },
            { label: 'Payment Started', count: paymentStarted },
            { label: 'Fully Paid', count: fullyPaid },
            { label: 'Event Completed', count: completedEvents }
        ],
        matrimony: [
            { label: 'Users Registered', count: totalUsers },
            { label: 'Profiles Created', count: totalProfiles },
            { label: 'Profiles Verified', count: verifiedProfiles }
        ]
    };
};

export const getDistributions = async () => {
    const genderDist = await prisma.profile.groupBy({
        by: ['gender'],
        _count: { _all: true },
        where: { gender: { not: null } }
    });

    const districtDist = await prisma.profile.groupBy({
        by: ['currentDistrict'],
        _count: { _all: true },
        where: { currentDistrict: { not: null } },
        orderBy: { _count: { currentDistrict: 'desc' } },
        take: 10
    });

    return {
        gender: genderDist.map(g => ({ label: g.gender, count: g._count._all })),
        district: districtDist.map(d => ({ label: d.currentDistrict, count: d._count._all }))
    };
};

export const getFullAnalytics = async () => {
    const [revenue, bookings, matrimony, packages, funnels, distributions] = await Promise.all([
        getRevenueAnalytics(),
        getMandapamAnalytics(),
        getMatrimonyAnalytics(),
        getPackagePerformance(),
        getFunnelAnalytics(),
        getDistributions()
    ]);

    const revenueFormatted = {
        ...revenue,
        highlights: {
            ...revenue.highlights,
            bookings: revenue.highlights.mandapam
        }
    };

    return {
        revenue: revenueFormatted,
        bookings,
        matrimony,
        packages,
        funnels,
        distributions
    };
};
