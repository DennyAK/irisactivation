"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const db = admin.firestore();
// Collections to audit
const audited = [
    'activations',
    'projects',
    'outlets',
    'sales_report_quick',
    'sales_report_detail',
    'task_attendance',
    'task_early_assessment',
    'tasks',
];
async function writeLog(entry) {
    await db.collection('audit_logs').add({
        ...entry,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}
function diff(before, after) {
    const changed = [];
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    for (const k of keys) {
        const b = before?.[k];
        const a = after?.[k];
        const bv = b && typeof b.toDate === 'function' ? b.toDate().toISOString() : b;
        const av = a && typeof a.toDate === 'function' ? a.toDate().toISOString() : a;
        if (JSON.stringify(bv) !== JSON.stringify(av))
            changed.push(k);
    }
    return changed;
}
function actorFromDoc(data) {
    const candidate = (data && (data.updatedBy || data.createdBy)) || null;
    return { actorId: candidate };
}
async function getActorInfo(actorId) {
    if (!actorId)
        return {};
    try {
        const snap = await db.collection('users').doc(actorId).get();
        if (!snap.exists)
            return {};
        const u = snap.data() || {};
        const actorEmail = u.email || null;
        const fullName = `${(u.firstName || '')} ${(u.lastName || '')}`.trim();
        const displayName = u.displayName || '';
        const actorName = (fullName || displayName || actorEmail || null);
        return { actorName, actorEmail };
    }
    catch {
        return {};
    }
}
for (const col of audited) {
    exports[`${col}OnCreate`] = (0, firestore_1.onDocumentCreated)(`/${col}/{id}`, async (event) => {
        const snap = event.data;
        if (!snap)
            return;
        const after = snap.data();
        const { actorId } = actorFromDoc(after);
        const actorInfo = await getActorInfo(actorId || undefined);
        await writeLog({ action: 'create', collection: col, docId: snap.id, actorId, ...actorInfo, after });
    });
    exports[`${col}OnUpdate`] = (0, firestore_1.onDocumentUpdated)(`/${col}/{id}`, async (event) => {
        const before = event.data?.before?.data() || {};
        const after = event.data?.after?.data() || {};
        const docId = event.params.id;
        const changedFields = diff(before, after);
        const { actorId } = actorFromDoc(after);
        const actorInfo = await getActorInfo(actorId || undefined);
        await writeLog({ action: 'update', collection: col, docId, actorId, ...actorInfo, before, after, changedFields });
    });
    exports[`${col}OnDelete`] = (0, firestore_1.onDocumentDeleted)(`/${col}/{id}`, async (event) => {
        const beforeSnap = event.data;
        if (!beforeSnap)
            return;
        const before = beforeSnap.data();
        const docId = event.params.id;
        const { actorId } = actorFromDoc(before);
        const actorInfo = await getActorInfo(actorId || undefined);
        await writeLog({ action: 'delete', collection: col, docId, actorId, ...actorInfo, before });
    });
}
