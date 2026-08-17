import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Meus veículos (vendendo)
  const myVehicles = await prisma.vehicle.findMany({
    where: { sellerId: session.userId },
    include: {
      images: { where: { isCover: true }, take: 1 },
      bids: { orderBy: { amount: "desc" }, take: 1 },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Minhas ofertas (comprando)
  const myBids = await prisma.bid.findMany({
    where: { bidderId: session.userId },
    include: {
      vehicle: {
        select: {
          id: true,
          title: true,
          images: { where: { isCover: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Minhas vendas (como comprador ou vendedor)
  const mySales = await prisma.sale.findMany({
    where: {
      OR: [{ buyerId: session.userId }, { sellerId: session.userId }],
    },
    include: {
      vehicle: {
        select: {
          id: true,
          title: true,
          images: { where: { isCover: true }, take: 1 },
        },
      },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    vehicles: myVehicles.map((v) => ({
      id: v.id,
      title: v.title,
      brand: v.brand,
      model: v.model,
      year: v.year,
      status: v.status,
      imageUrl: v.images[0]?.url || null,
      highBid: v.bids[0]?.amount || v.startingBid,
      bidsCount: v._count.bids,
      auctionEnd: v.auctionEnd?.toISOString() || null,
    })),
    bids: myBids.map((b) => ({
      id: b.id,
      amount: b.amount,
      paymentMethod: b.paymentMethod,
      status: b.status,
      vehicleTitle: b.vehicle.title,
      vehicleId: b.vehicle.id,
      vehicleImage: b.vehicle.images[0]?.url || null,
      createdAt: b.createdAt.toISOString(),
    })),
    sales: mySales.map((s) => ({
      id: s.id,
      salePrice: s.salePrice,
      paymentMethod: s.paymentMethod,
      vehicleTitle: s.vehicle.title,
      vehicleId: s.vehicle.id,
      vehicleImage: s.vehicle.images[0]?.url || null,
      otherPartyName: s.buyerId === session.userId ? s.seller.name : s.buyer.name,
      role: s.buyerId === session.userId ? "buyer" : "seller",
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
