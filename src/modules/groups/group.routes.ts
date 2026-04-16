import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware";
import { groupController } from "./group.controller";

const router = Router();

router.use(authenticate);

router.get("/", groupController.getMyGroups);
router.post("/", groupController.createGroup);
router.get("/:groupId", groupController.getGroup);
router.post("/:groupId/members", groupController.addMember);
router.delete("/:groupId/members/:userId", groupController.removeMember);

export default router;
