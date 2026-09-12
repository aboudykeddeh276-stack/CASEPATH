/**
 * KEDDEH / BRAINK Core Engine Evolution v29
 * Advanced Transactional VFS, Merkle Receipt Ledger, and DAG Skill Dispatcher
 * Operating Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236)
 */

class TransactionalVFS {
    constructor() {
        this.store = new Map();
        this.snapshots = new Map();
        this.txLog = [];
    }

    begin() {
        const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.snapshots.set(txId, new Map(this.store));
        return txId;
    }

    commit(txId) {
        if (!this.snapshots.has(txId)) {
            throw new Error(`TRANSACTION_ERROR: Invalid or expired transaction handle [${txId}]`);
        }
        this.snapshots.delete(txId);
        this.txLog.push({ txId, action: 'COMMIT', ts: new Date().toISOString() });
        return true;
    }

    rollback(txId) {
        if (!this.snapshots.has(txId)) {
            throw new Error(`TRANSACTION_ERROR: Cannot rollback unknown transaction [${txId}]`);
        }
        this.store = this.snapshots.get(txId);
        this.snapshots.delete(txId);
        this.txLog.push({ txId, action: 'ROLLBACK', ts: new Date().toISOString() });
        return true;
    }

    set(path, value, meta = {}) {
        this.store.set(path, {
            value,
            meta: { ...meta, updatedTs: Date.now(), version: (this.store.get(path)?.meta?.version || 0) + 1 }
        });
    }

    get(path) {
        return this.store.get(path)?.value;
    }

    getMetadata(path) {
        return this.store.get(path)?.meta || null;
    }

    entries() {
        return Array.from(this.store.entries()).map(([k, v]) => ({ path: k, ...v }));
    }
}

class MerkleReceiptLedger {
    constructor() {
        this.chain = [];
        this.genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";
    }

    async commit(type, payload) {
        const prevHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : this.genesisHash;
        const entry = {
            index: this.chain.length,
            timestamp: new Date().toISOString(),
            type,
            payload,
            prevHash
        };
        
        const raw = JSON.stringify(entry);
        entry.hash = await this._sha256(raw);
        this.chain.push(entry);
        return entry;
    }

    async verifyIntegrity() {
        for (let i = 0; i < this.chain.length; i++) {
            const block = this.chain[i];
            const expectedPrev = i === 0 ? this.genesisHash : this.chain[i - 1].hash;
            if (block.prevHash !== expectedPrev) {
                return { valid: false, failedIndex: i, reason: "BROKEN_HASH_CHAIN" };
            }
            
            const tempBlock = { ...block };
            delete tempBlock.hash;
            const recomputedHash = await this._sha256(JSON.stringify(tempBlock));
            if (recomputedHash !== block.hash) {
                return { valid: false, failedIndex: i, reason: "TAMPERED_BLOCK_PAYLOAD" };
            }
        }
        return { valid: true, totalBlocks: this.chain.length };
    }

    async _sha256(text) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const data = new TextEncoder().encode(text);
            const buf = await crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        }
        return "sha256_mock_" + text.length;
    }
}

class DAGEngine {
    constructor() {
        this.skills = new Map();
    }

    register(skillDef) {
        if (!skillDef.id || typeof skillDef.run !== 'function') {
            throw new Error("DAG_REGISTRATION_ERROR: Invalid skill signature.");
        }
        this.skills.set(skillDef.id, skillDef);
    }

    async executePipeline(targetSkillIds, context = {}) {
        const executed = new Set();
        const results = context.results || {};
        
        const resolveDeps = async (skillId) => {
            if (executed.has(skillId)) return;
            const skill = this.skills.get(skillId);
            if (!skill) throw new Error(`DAG_EXECUTION_ERROR: Unresolved skill dependency [${skillId}]`);

            if (skill.dependsOn) {
                for (const depId of skill.dependsOn) {
                    await resolveDeps(depId);
                }
            }

            if (!results[skillId]) {
                const startTime = performance.now();
                results[skillId] = await skill.run({ ...context, results });
                results[skillId]._executionMetrics = {
                    durationMs: Number((performance.now() - startTime).toFixed(2)),
                    timestamp: new Date().toISOString()
                };
            }
            executed.add(skillId);
        };

        for (const id of targetSkillIds) {
            await resolveDeps(id);
        }

        return results;
    }
}

if (typeof window !== 'undefined') {
    window.KeddehCoreEvolution = {
        TransactionalVFS,
        MerkleReceiptLedger,
        DAGEngine
    };
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TransactionalVFS, MerkleReceiptLedger, DAGEngine };
}
