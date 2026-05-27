import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import Service from "@/models/Service";
import Salon from "@/models/Salon";
import Category from "@/models/Category";

/**
 * Resolve which salon a booking belongs to when the client could not
 * determine it (missing employee.salon, auto-assign edge cases, etc.).
 */
export async function resolveSalonForBooking({
  salon: salonFromClient,
  employeeId,
  serviceIds = [],
}) {
  if (salonFromClient) return salonFromClient;

  await connectDB();

  if (employeeId) {
    const emp = await Employee.findById(employeeId).select("salon").lean();
    if (emp?.salon) return String(emp.salon);
  }

  const ids = (serviceIds || []).filter(Boolean).map(String);
  if (ids.length > 0) {
    const primary = await Service.findById(ids[0])
      .select("category clinic")
      .populate("category", "type salons")
      .lean();

    if (primary?.clinic) {
      return String(primary.clinic);
    }

    const category = primary?.category;
    if (category?.salons?.length > 0) {
      const assigned = await Salon.findOne({
        _id: { $in: category.salons },
        active: { $ne: false },
      })
        .select("_id")
        .lean();
      if (assigned?._id) return String(assigned._id);
    }

    if (category?.type) {
      const byType = await Salon.findOne({
        type: category.type,
        active: { $ne: false },
      })
        .select("_id")
        .lean();
      if (byType?._id) return String(byType._id);
    }

    const categoryId =
      typeof category === "object" ? category?._id : category;
    if (categoryId && !category?.type) {
      const cat = await Category.findById(categoryId).select("type salons").lean();
      if (cat?.salons?.length > 0) {
        const assigned = await Salon.findOne({
          _id: { $in: cat.salons },
          active: { $ne: false },
        })
          .select("_id")
          .lean();
        if (assigned?._id) return String(assigned._id);
      }
      if (cat?.type) {
        const byType = await Salon.findOne({
          type: cat.type,
          active: { $ne: false },
        })
          .select("_id")
          .lean();
        if (byType?._id) return String(byType._id);
      }
    }
  }

  const anySalon = await Salon.findOne({ active: { $ne: false } })
    .select("_id")
    .sort({ createdAt: -1 })
    .lean();
  if (anySalon?._id) return String(anySalon._id);

  return null;
}
