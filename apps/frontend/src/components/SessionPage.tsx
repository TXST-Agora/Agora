import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import './SessionPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type SessionData = {
    sessionCode: string;
    title: string;
    description: string;
    mode: string;
    hostStartTime: string;
    actions: Array<{
        id: string;
        actionID: number;
        type: string;
        content: string;
        start_time: string;
        size?: number;
        color?: string;
    }>;
};

const SessionPage = () => {
    const { sessionCode } = useParams<{ sessionCode: string }>();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true)
    const [showAskModal, setShowAskModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showNoSpaceModal, setShowNoSpaceModal] = useState(false);
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string>("");

    const [submittedElements, setSubmittedElements] = useState<Array<{ id: string; actionID: number; type: string; content: string; submitTime: string; x?: number; y?: number; size?: number; color?: string }>>([]);
    const [maxActionID, setMaxActionID] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Helper function to get available bounds for positioning elements
    // Accounts for navbar at top (64px) and FAB area at bottom (140px)
    const getAvailableBounds = useCallback(() => {
        const navbarHeight = 64; // Navbar height
        const bottomPadding = 140; // Bottom padding for FAB area
        const rect = containerRef.current?.getBoundingClientRect();
        const containerWidth = rect ? rect.width : window.innerWidth;
        const containerHeight = rect ? rect.height : window.innerHeight;
        
        return {
            width: containerWidth,
            height: containerHeight - navbarHeight - bottomPadding, // Available height
            topOffset: navbarHeight, // Start position from top
            bottomOffset: bottomPadding
        };
    }, []);

    // Function to check if there's space available for a new action
    // This should be optimistic - always allow attempts, let submission logic handle making room
    const checkSpaceAvailable = useCallback((): boolean => {
        // Always return true - let the submission logic handle finding space and making room
        // This prevents blocking users when there's clearly space that can be made
        return true;
    }, []);

    // Function to update action size in the database
    const updateActionSizeInDB = useCallback(async (actionID: number, size: number) => {
        if (!sessionCode) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}/action/${actionID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ size }),
            });

            if (!response.ok) {
                console.error(`Failed to update action ${actionID} size:`, response.statusText);
                return;
            }

            console.log(`Action ${actionID} size updated to ${size}px`);
        } catch (error) {
            console.error(`Error updating action ${actionID} size:`, error);
        }
    }, [sessionCode]);

    // Function to fetch actions with times and update sizes
    const getActions = useCallback(async () => {
        if (!sessionCode) return;

        // Check if mode is sizePulse - only grow sizes in this mode
        const isSizePulseMode = sessionData?.mode?.toLowerCase() === 'sizepulse';

        // Calculate size based on timeMargin (in seconds)
        // Base size: 48px, grows by 0.5px per second, max size: 150px
        // Only grows if mode is sizePulse
        const calculateSizeFromTimeMargin = (timeMargin: number | null): number => {
            const baseSize = 48;
            
            // If not sizePulse mode, always return base size
            if (!isSizePulseMode) {
                return baseSize;
            }
            
            const growthRate = 0.5; // pixels per second (slower growth)
            const maxSize = 150;
            
            if (timeMargin === null || timeMargin <= 0) {
                return baseSize;
            }
            
            const calculatedSize = baseSize + (timeMargin * growthRate);
            return Math.min(calculatedSize, maxSize);
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}/actions/times`);
            if (!response.ok) {
                console.error("Failed to fetch actions with times");
                return;
            }

            const data = await response.json();
            console.log("Actions with times:", data);
            
            // Update sizes based on timeMargin
            if (data.actions && Array.isArray(data.actions)) {
                setSubmittedElements((prevElements) => {
                    // First, update sizes
                    const updatedElements = prevElements.map((element) => {
                        // Use Number() to ensure type matching (actionID might be number or string)
                        const actionData = data.actions.find((a: { actionID: number }) => 
                            Number(a.actionID) === Number(element.actionID)
                        );
                        
                        let newSize: number;
                        let timeMargin: number | null = null;
                        
                        // If not sizePulse mode, always use base size (48px)
                        if (!isSizePulseMode) {
                            newSize = 48;
                        } else {
                            // Only calculate growth in sizePulse mode
                            if (actionData) {
                                // Use timeMargin from backend
                                timeMargin = actionData.timeMargin;
                                newSize = calculateSizeFromTimeMargin(timeMargin);
                            } else {
                                // Element not in backend response yet - calculate from submitTime
                                if (element.submitTime) {
                                    const submitTime = new Date(element.submitTime);
                                    const now = new Date();
                                    timeMargin = (now.getTime() - submitTime.getTime()) / 1000;
                                    newSize = calculateSizeFromTimeMargin(timeMargin);
                                } else {
                                    // No submitTime, keep current size
                                    newSize = element.size ?? 48;
                                }
                            }
                        }
                        
                        const currentSize = element.size ?? 48; // Default to 48 if size is undefined
                        
                        // Update size if it has changed (only in sizePulse mode)
                        if (currentSize !== newSize) {
                            console.log(`Updating size for ${element.type} actionID ${element.actionID}: ${currentSize} -> ${newSize}`);
                            
                            // Only update in database if we have actionData (from backend) and mode is sizePulse
                            if (actionData && isSizePulseMode) {
                                updateActionSizeInDB(element.actionID, newSize);
                            }
                            
                            return {
                                ...element,
                                size: newSize,
                                color: actionData?.color || element.color,
                            };
                        } else if (actionData && actionData.color && actionData.color !== element.color) {
                            // Update color even if size hasn't changed
                            return {
                                ...element,
                                color: actionData.color,
                            };
                        }
                        
                        return element;
                    });

                    // Now check for overlaps and reposition if needed
                    const gap = 8;
                    const bounds = getAvailableBounds();
                    const maxLeft = Math.max(0, bounds.width - 150 - (gap * 2));
                    const maxTop = Math.max(0, bounds.height - 150 - (gap * 2));

                    const checkOverlap = (
                        elem1: { x?: number; y?: number; size?: number },
                        elem2: { x?: number; y?: number; size?: number }
                    ): boolean => {
                        if (elem1.x == null || elem1.y == null || elem2.x == null || elem2.y == null) {
                            return false;
                        }
                        const size1 = (elem1.size ?? 48) + (gap * 2);
                        const size2 = (elem2.size ?? 48) + (gap * 2);

                        const ax1 = elem1.x - gap;
                        const ay1 = elem1.y - gap;
                        const ax2 = elem1.x + size1;
                        const ay2 = elem1.y + size1;

                        const bx1 = elem2.x - gap;
                        const by1 = elem2.y - gap;
                        const bx2 = elem2.x + size2;
                        const by2 = elem2.y + size2;

                        return !(ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2);
                    };

                    // Iteratively resolve all overlaps until none remain
                    let repositionedElements = [...updatedElements];
                    let hasOverlaps = true;
                    let iterations = 0;
                    const maxIterations = 10; // Prevent infinite loops
                    
                    while (hasOverlaps && iterations < maxIterations) {
                        iterations++;
                        hasOverlaps = false;
                        const repositioned = new Map<string, { x: number; y: number }>();
                        
                        // Check all pairs for overlaps
                        for (let i = 0; i < repositionedElements.length; i++) {
                            const elem1 = repositionedElements[i];
                            if (elem1.x == null || elem1.y == null) continue;
                            
                            // Check if this element overlaps with any other
                            let needsRepositioning = false;
                            
                            for (let j = 0; j < repositionedElements.length; j++) {
                                if (i === j) continue;
                                const elem2 = repositionedElements[j];
                                if (elem2.x == null || elem2.y == null) continue;
                                
                                // Use repositioned position if available
                                const elem2X = repositioned.has(elem2.id) ? repositioned.get(elem2.id)!.x : elem2.x;
                                const elem2Y = repositioned.has(elem2.id) ? repositioned.get(elem2.id)!.y : elem2.y;
                                
                                if (elem2X == null || elem2Y == null) continue;
                                
                                const testElem2 = { x: elem2X, y: elem2Y, size: elem2.size };
                                
                                if (checkOverlap(elem1, testElem2)) {
                                    needsRepositioning = true;
                                    hasOverlaps = true;
                                    break;
                                }
                            }
                            
                            if (needsRepositioning && !repositioned.has(elem1.id)) {
                                const elemSize = (elem1.size ?? 48) + (gap * 2);
                                
                                // Try multiple shift distances
                                const shiftDistances = [elemSize * 0.3, elemSize * 0.5, elemSize * 0.75, elemSize, elemSize * 1.5];
                                const directions = [
                                    { dx: 1, dy: 0 },      // Right
                                    { dx: -1, dy: 0 },     // Left
                                    { dx: 0, dy: 1 },      // Down
                                    { dx: 0, dy: -1 },     // Up
                                    { dx: 1, dy: 1 },      // Down-Right
                                    { dx: -1, dy: 1 },     // Down-Left
                                    { dx: 1, dy: -1 },     // Up-Right
                                    { dx: -1, dy: -1 },    // Up-Left
                                ];
                                
                                let foundPosition = false;
                                
                                for (const distance of shiftDistances) {
                                    for (const dir of directions) {
                                        const newX = elem1.x + dir.dx * distance;
                                        const newY = elem1.y + dir.dy * distance;
                                        
                                        // Check bounds
                                        if (newX >= 0 && newX <= maxLeft && 
                                            newY >= bounds.topOffset && newY <= bounds.topOffset + maxTop) {
                                            
                                            // Check if new position overlaps with any other element
                                            let validPosition = true;
                                            const testElement = { x: newX, y: newY, size: elem1.size };
                                            
                                            for (const otherElem of repositionedElements) {
                                                if (otherElem.id === elem1.id) continue;
                                                
                                                const otherX = repositioned.has(otherElem.id) 
                                                    ? repositioned.get(otherElem.id)!.x 
                                                    : otherElem.x;
                                                const otherY = repositioned.has(otherElem.id) 
                                                    ? repositioned.get(otherElem.id)!.y 
                                                    : otherElem.y;
                                                
                                                if (otherX == null || otherY == null) continue;
                                                
                                                const otherTestElement = { x: otherX, y: otherY, size: otherElem.size };
                                                if (checkOverlap(testElement, otherTestElement)) {
                                                    validPosition = false;
                                                    break;
                                                }
                                            }
                                            
                                            if (validPosition) {
                                                repositioned.set(elem1.id, { x: newX, y: newY });
                                                foundPosition = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (foundPosition) break;
                                }
                                
                                // If simple shifts didn't work, try grid search
                                if (!foundPosition) {
                                    const gridStep = elemSize * 0.8;
                                    for (let y = bounds.topOffset; y <= bounds.topOffset + maxTop && !foundPosition; y += gridStep) {
                                        for (let x = 0; x <= maxLeft && !foundPosition; x += gridStep) {
                                            const testElement = { x: Math.floor(x), y: Math.floor(y), size: elem1.size };
                                            let validPosition = true;
                                            
                                            for (const otherElem of repositionedElements) {
                                                if (otherElem.id === elem1.id) continue;
                                                
                                                const otherX = repositioned.has(otherElem.id) 
                                                    ? repositioned.get(otherElem.id)!.x 
                                                    : otherElem.x;
                                                const otherY = repositioned.has(otherElem.id) 
                                                    ? repositioned.get(otherElem.id)!.y 
                                                    : otherElem.y;
                                                
                                                if (otherX == null || otherY == null) continue;
                                                
                                                const otherTestElement = { x: otherX, y: otherY, size: otherElem.size };
                                                if (checkOverlap(testElement, otherTestElement)) {
                                                    validPosition = false;
                                                    break;
                                                }
                                            }
                                            
                                            if (validPosition) {
                                                repositioned.set(elem1.id, { x: Math.floor(x), y: Math.floor(y) });
                                                foundPosition = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Apply repositioning
                        if (repositioned.size > 0) {
                            repositionedElements = repositionedElements.map((element) => {
                                if (repositioned.has(element.id)) {
                                    const newPos = repositioned.get(element.id)!;
                                    return { ...element, x: newPos.x, y: newPos.y };
                                }
                                return element;
                            });
                        }
                    }

                    return repositionedElements;
                });
            }
        } catch (error) {
            console.error("Error fetching actions with times:", error);
        }
    }, [sessionCode, sessionData, updateActionSizeInDB, getAvailableBounds]);

    // Load session data on mount
    useEffect(() => {
        const loadSession = async () => {
            if (!sessionCode) {
                setLoadError("Session code is missing");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setLoadError("Session not found");
                    } else {
                        setLoadError("Failed to load session");
                    }
                    setIsLoading(false);
                    return;
                }

                const data: SessionData = await response.json();
                setSessionData(data);

                // Load existing actions and convert to display format
                if (data.actions && data.actions.length > 0) {
                    // Find the maximum actionID from loaded actions
                    const maxID = Math.max(...data.actions.map(a => a.actionID || 0), 0);
                    setMaxActionID(maxID);

                    // Use the same overlap detection logic as for new actions
                    const maxPossibleSize = 150;
                    const gap = 8;
                    const bounds = getAvailableBounds();
                    const effectiveSize = maxPossibleSize + (gap * 2);
                    const maxLeft = Math.max(0, bounds.width - effectiveSize);
                    const maxTop = Math.max(0, bounds.height - effectiveSize);

                    const overlaps = (x: number, y: number, existingElements: Array<{ x?: number; y?: number }>): boolean => {
                        for (const e of existingElements) {
                            if (e.x == null || e.y == null) continue;
                            const existingSize = maxPossibleSize + (gap * 2);
                            
                            const ax1 = x - gap;
                            const ay1 = y - gap;
                            const ax2 = x + effectiveSize;
                            const ay2 = y + effectiveSize;

                            const bx1 = e.x - gap;
                            const by1 = e.y - gap;
                            const bx2 = e.x + existingSize;
                            const by2 = e.y + existingSize;

                            const noOverlap = ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2;
                            if (!noOverlap) return true;
                        }
                        return false;
                    };

                    const elements: Array<{ id: string; actionID: number; type: string; content: string; submitTime: string; x?: number; y?: number; size?: number; color?: string }> = [];
                    
                    for (const action of data.actions) {
                        let foundPosition = false;
                        let left = 0;
                        let top = 0;

                        // Try random positions first
                        let attempts = 0;
                        const randomAttempts = 100;
                        while (!foundPosition && attempts < randomAttempts) {
                            left = Math.floor(Math.random() * (maxLeft + 1));
                            top = bounds.topOffset + Math.floor(Math.random() * (maxTop + 1)); // Add top offset
                            if (!overlaps(left, top, elements)) {
                                foundPosition = true;
                                break;
                            }
                            attempts++;
                        }

                        // If random search failed, try grid search
                        if (!foundPosition) {
                            const gridStep = effectiveSize;
                            for (let y = bounds.topOffset; y <= bounds.topOffset + maxTop; y += gridStep) {
                                for (let x = 0; x <= maxLeft; x += gridStep) {
                                    if (!overlaps(x, y, elements)) {
                                        left = x;
                                        top = y;
                                        foundPosition = true;
                                        break;
                                    }
                                }
                                if (foundPosition) break;
                            }
                        }

                        // If position found, add element
                        if (foundPosition) {
                            elements.push({
                                id: action.id,
                                actionID: action.actionID,
                                type: action.type,
                                content: action.content,
                                submitTime: action.start_time,
                                x: left,
                                y: top,
                                size: action.size ?? 48,
                                color: action.color,
                            });
                        }
                    }

                    setSubmittedElements(elements);
                    setVisible(false);
                } else {
                    setMaxActionID(0);
                }
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load session");
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, [sessionCode]);

    // Poll for actions with times every 1 second for smoother updates
    useEffect(() => {
        if (!sessionCode) return;

        const interval = setInterval(() => {
            getActions();
        }, 1000); // 1 second - more frequent updates for smoother growth

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [sessionCode, getActions]);

    // Function to check if a position overlaps with an element
    const checkElementOverlap = (
        x: number, y: number, checkSize: number,
        elemX: number, elemY: number, elemSize: number,
        gap: number
    ): boolean => {
        const ax1 = x - gap;
        const ay1 = y - gap;
        const ax2 = x + checkSize;
        const ay2 = y + checkSize;

        const bx1 = elemX - gap;
        const by1 = elemY - gap;
        const bx2 = elemX + elemSize;
        const by2 = elemY + elemSize;

        return !(ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2);
    };

    // Recursive function to try shifting elements to make room
    const tryShiftElements = (
        elementsToShift: Array<{ id: string; x: number; y: number; size?: number }>,
        allElements: Array<{ id: string; x?: number; y?: number; size?: number }>,
        shiftedSoFar: Map<string, { x: number; y: number }>,
        maxPossibleSize: number,
        gap: number,
        effectiveSize: number,
        bounds: { width: number; height: number; topOffset: number; bottomOffset: number },
        maxLeft: number,
        maxTop: number,
        maxDepth: number = 5
    ): Map<string, { x: number; y: number }> | null => {
        if (maxDepth <= 0 || elementsToShift.length === 0) {
            return null;
        }

        // Try smaller shifts first - more likely to work and less disruptive
        const baseShift = effectiveSize + gap;
        const shiftDistances = [
            baseShift * 0.3,  // Small shift
            baseShift * 0.5,  // Medium shift
            baseShift * 0.75, // Large shift
            baseShift,        // Full shift
            baseShift * 1.5   // Extra shift
        ];
        const shiftDirections = [
            { dx: 1, dy: 0 },      // Right
            { dx: -1, dy: 0 },     // Left
            { dx: 0, dy: 1 },      // Down
            { dx: 0, dy: -1 },     // Up
            { dx: 1, dy: 1 },     // Down-Right
            { dx: -1, dy: 1 },    // Down-Left
            { dx: 1, dy: -1 },    // Up-Right
            { dx: -1, dy: -1 },   // Up-Left
        ];

        for (const elem of elementsToShift) {
            if (shiftedSoFar.has(elem.id)) continue; // Already shifted

            let foundShift = false;
            for (const distance of shiftDistances) {
                for (const dir of shiftDirections) {
                    const newX = elem.x + dir.dx * distance;
                    const newY = elem.y + dir.dy * distance;

                    // Check bounds
                    if (newX < 0 || newX > maxLeft || 
                        newY < bounds.topOffset || newY > bounds.topOffset + maxTop) {
                        continue;
                    }

                    // Get the actual size of the element being shifted (use current size, not max)
                    const elemSize = elem.size ?? 48;
                    const elemEffectiveSize = elemSize + (gap * 2);

                    // Check if new position overlaps with any non-shifted elements
                    let validPosition = true;
                    const newConflicts: Array<{ id: string; x: number; y: number; size?: number }> = [];

                    for (const other of allElements) {
                        if (other.x == null || other.y == null) continue;
                        if (other.id === elem.id) continue;
                        
                        // Check if this element is already being shifted
                        const alreadyShifted = shiftedSoFar.has(other.id);
                        const otherX = alreadyShifted ? shiftedSoFar.get(other.id)!.x : other.x;
                        const otherY = alreadyShifted ? shiftedSoFar.get(other.id)!.y : other.y;
                        const otherSize = other.size ?? 48;
                        const otherEffectiveSize = otherSize + (gap * 2);

                        if (checkElementOverlap(newX, newY, elemEffectiveSize, otherX, otherY, otherEffectiveSize, gap)) {
                            // This element conflicts - we'll need to shift it too
                            if (!alreadyShifted && !elementsToShift.some(e => e.id === other.id)) {
                                newConflicts.push({ id: other.id, x: otherX, y: otherY, size: otherSize });
                            } else if (!alreadyShifted) {
                                validPosition = false;
                                break;
                            }
                        }
                    }

                    if (validPosition) {
                        // Try to recursively shift conflicting elements
                        if (newConflicts.length > 0) {
                            const newShifted = new Map(shiftedSoFar);
                            newShifted.set(elem.id, { x: newX, y: newY });
                            
                            const recursiveResult = tryShiftElements(
                                newConflicts,
                                allElements,
                                newShifted,
                                maxPossibleSize,
                                gap,
                                effectiveSize,
                                bounds,
                                maxLeft,
                                maxTop,
                                maxDepth - 1
                            );

                            if (recursiveResult !== null) {
                                recursiveResult.set(elem.id, { x: newX, y: newY });
                                return recursiveResult;
                            }
                        } else {
                            // No conflicts, we can shift this element
                            shiftedSoFar.set(elem.id, { x: newX, y: newY });
                            foundShift = true;
                            break;
                        }
                    }
                }
                if (foundShift) break;
            }

            if (!foundShift) {
                return null; // Couldn't shift this element
            }
        }

        return shiftedSoFar;
    };

    // Function to find gaps between existing elements (smart candidate generation)
    const findGapPositions = (
        bounds: { width: number; height: number; topOffset: number; bottomOffset: number },
        maxLeft: number,
        maxTop: number,
        gap: number,
        effectiveSize: number
    ): Array<{ x: number; y: number }> => {
        const candidates: Array<{ x: number; y: number }> = [];
        const elementsWithPositions = submittedElements.filter(e => e.x != null && e.y != null);
        
        if (elementsWithPositions.length === 0) {
            // No elements, return center position
            return [{ x: Math.floor(maxLeft / 2), y: bounds.topOffset + Math.floor(maxTop / 2) }];
        }

        // Find positions between existing elements
        for (let i = 0; i < elementsWithPositions.length; i++) {
            const elem1 = elementsWithPositions[i];
            if (elem1.x == null || elem1.y == null) continue;
            const size1 = (elem1.size ?? 48) + (gap * 2);

            for (let j = i + 1; j < elementsWithPositions.length; j++) {
                const elem2 = elementsWithPositions[j];
                if (elem2.x == null || elem2.y == null) continue;
                const size2 = (elem2.size ?? 48) + (gap * 2);

                // Calculate midpoint between elements
                const midX = (elem1.x + elem2.x) / 2;
                const midY = (elem1.y + elem2.y) / 2;

                // Check if there's enough space at midpoint
                if (midX >= 0 && midX <= maxLeft && 
                    midY >= bounds.topOffset && midY <= bounds.topOffset + maxTop) {
                    candidates.push({ x: Math.floor(midX), y: Math.floor(midY) });
                }

                // Also try positions around the gap
                const distance = Math.sqrt(
                    Math.pow(elem2.x - elem1.x, 2) + Math.pow(elem2.y - elem1.y, 2)
                );
                if (distance > size1 + size2) {
                    // There's a gap, try positions along the line
                    const steps = Math.floor(distance / effectiveSize);
                    for (let s = 1; s < steps; s++) {
                        const t = s / steps;
                        const x = elem1.x + (elem2.x - elem1.x) * t;
                        const y = elem1.y + (elem2.y - elem1.y) * t;
                        if (x >= 0 && x <= maxLeft && 
                            y >= bounds.topOffset && y <= bounds.topOffset + maxTop) {
                            candidates.push({ x: Math.floor(x), y: Math.floor(y) });
                        }
                    }
                }
            }
        }

        return candidates;
    };

    // Function to try making room for a new element by repositioning existing ones
    const tryMakeRoomForNewElement = (
        bounds: { width: number; height: number; topOffset: number; bottomOffset: number },
        maxPossibleSize: number,
        gap: number,
        effectiveSize: number,
        maxLeft: number,
        maxTop: number,
        overlaps: (x: number, y: number, checkSize?: number) => boolean
    ): { success: boolean; newX?: number; newY?: number; shiftedElements?: Array<{ id: string; newX: number; newY: number }> } => {
        const candidates: Array<{ x: number; y: number }> = [];
        
        // First, try to find gaps between existing elements (smart positioning)
        const gapCandidates = findGapPositions(bounds, maxLeft, maxTop, gap, effectiveSize);
        candidates.push(...gapCandidates);

        // Add grid-based candidates with smaller step for better coverage
        const gridStep = effectiveSize * 0.6; // Smaller step for denser grid
        for (let y = bounds.topOffset; y <= bounds.topOffset + maxTop; y += gridStep) {
            for (let x = 0; x <= maxLeft; x += gridStep) {
                candidates.push({ x: Math.floor(x), y: Math.floor(y) });
            }
        }

        // Add random candidates for better coverage
        for (let i = 0; i < 100; i++) {
            candidates.push({
                x: Math.floor(Math.random() * (maxLeft + 1)),
                y: bounds.topOffset + Math.floor(Math.random() * (maxTop + 1))
            });
        }

        // Shuffle candidates for better distribution
        candidates.sort(() => Math.random() - 0.5);

        for (const candidate of candidates) {
            // Find elements that overlap with this candidate position
            // Use actual element sizes, not max size, to be less conservative
            // New element is 48px, so use that for overlap detection
            const newElementSize = 48;
            const newElementEffectiveSize = newElementSize + (gap * 2);
            
            const overlappingElements = submittedElements
                .filter((e) => {
                    if (e.x == null || e.y == null) return false;
                    const eSize = e.size ?? 48;
                    const eEffectiveSize = eSize + (gap * 2);
                    return checkElementOverlap(
                        candidate.x, candidate.y, newElementEffectiveSize, // Use new element size
                        e.x, e.y, eEffectiveSize, gap
                    );
                })
                .map(e => ({ id: e.id, x: e.x!, y: e.y!, size: e.size }));

            // If no overlaps, we can use this position directly
            if (overlappingElements.length === 0) {
                return { success: true, newX: candidate.x, newY: candidate.y, shiftedElements: [] };
            }

            // Try to shift overlapping elements recursively
            const shiftedMap = tryShiftElements(
                overlappingElements,
                submittedElements,
                new Map(),
                maxPossibleSize,
                gap,
                newElementEffectiveSize, // Use new element size
                bounds,
                maxLeft,
                maxTop,
                5 // Increased recursion depth for better success
            );

            if (shiftedMap && shiftedMap.size === overlappingElements.length) {
                const shiftedElements = Array.from(shiftedMap.entries()).map(([id, pos]) => ({
                    id,
                    newX: pos.x,
                    newY: pos.y
                }));
                return { success: true, newX: candidate.x, newY: candidate.y, shiftedElements };
            }
        }

        return { success: false };
    };

    const submitElement = async (type: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
            // simple client-side validation
            alert("Please type a response before submitting.");
            return;
        }

        if (!sessionCode) {
            alert("Session code is missing. Please check the URL.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate numeric actionID on frontend (1-based, incrementing)
            // Use the max actionID from loaded session data + 1, or start at 1 if no actions
            const actionID = maxActionID + 1;

            // Call backend API to add action
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    content: trimmed,
                    actionID: actionID,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to submit' }));
                throw new Error(errorData.message || 'Failed to submit');
            }

            const data = await response.json();

            // Success - add to local state for display
            // Use the UUID and actionID from backend response
            const backendActionID = data.action?.actionID || actionID;
            const id = data.action?.id || `temp-${backendActionID}`;
            const date = new Date();

            // compute a non-overlapping position inside the session container
            const gap = 8; // px minimum gap between fabs
            const bounds = getAvailableBounds();
            
            // New element starts at 48px, use that for positioning
            const newElementSize = 48;
            const newElementEffectiveSize = newElementSize + (gap * 2);
            const maxLeft = Math.max(0, bounds.width - newElementEffectiveSize);
            const maxTop = Math.max(0, bounds.height - newElementEffectiveSize);

            // Check if a position overlaps with any existing element
            // Use actual element sizes (not max) to allow more elements to fit
            const overlaps = (x: number, y: number, checkSize: number = newElementEffectiveSize): boolean => {
                for (const e of submittedElements) {
                    if (e.x == null || e.y == null) continue;
                    // Use actual size of existing element, not max size
                    const eSize = e.size ?? 48;
                    const existingSize = eSize + (gap * 2);
                    
                    const ax1 = x - gap;
                    const ay1 = y - gap;
                    const ax2 = x + checkSize;
                    const ay2 = y + checkSize;

                    const bx1 = e.x - gap;
                    const by1 = e.y - gap;
                    const bx2 = e.x + existingSize;
                    const by2 = e.y + existingSize;

                    const noOverlap = ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2;
                    if (!noOverlap) return true;
                }
                return false;
            };

            // Try to find a non-overlapping position using a grid-based approach
            // This is more systematic than random attempts
            const gridStep = newElementEffectiveSize * 0.7; // Smaller step for denser search
            let foundPosition = false;
            let left = 0;
            let top = 0;

            // First, try random positions (faster for sparse boards)
            let attempts = 0;
            const randomAttempts = 200; // More attempts
            while (!foundPosition && attempts < randomAttempts) {
                left = Math.floor(Math.random() * (maxLeft + 1));
                top = bounds.topOffset + Math.floor(Math.random() * (maxTop + 1)); // Add top offset
                if (!overlaps(left, top)) {
                    foundPosition = true;
                    break;
                }
                attempts++;
            }

            // If random search failed, try systematic grid search
            if (!foundPosition) {
                for (let y = bounds.topOffset; y <= bounds.topOffset + maxTop; y += gridStep) {
                    for (let x = 0; x <= maxLeft; x += gridStep) {
                        if (!overlaps(x, y)) {
                            left = x;
                            top = y;
                            foundPosition = true;
                            break;
                        }
                    }
                    if (foundPosition) break;
                }
            }

            // If still no position found, try to make room by repositioning existing elements
            if (!foundPosition) {
                const repositionResult = tryMakeRoomForNewElement(
                    bounds,
                    150, // maxPossibleSize
                    gap,
                    newElementEffectiveSize, // Use new element size, not max
                    maxLeft,
                    maxTop,
                    overlaps
                );
                
                if (repositionResult.success && 
                    repositionResult.newX !== undefined && 
                    repositionResult.newY !== undefined) {
                    left = repositionResult.newX;
                    top = repositionResult.newY;
                    foundPosition = true;
                    
                    // Update positions of shifted elements
                    if (repositionResult.shiftedElements && repositionResult.shiftedElements.length > 0) {
                        setSubmittedElements((prev) => {
                            return prev.map((elem) => {
                                const shift = repositionResult.shiftedElements!.find(
                                    (s) => s.id === elem.id
                                );
                                if (shift) {
                                    return { ...elem, x: shift.newX, y: shift.newY };
                                }
                                return elem;
                            });
                        });
                    }
                }
            }

            // If still no position found after trying to make room, show modal
            if (!foundPosition) {
                // Close any open modals first
                setShowAskModal(false);
                setShowCommentModal(false);
                setShowNoSpaceModal(true);
                setIsSubmitting(false);
                return; // Don't add the element if there's no space
            }

            // Ensure size is set (default to 48 if not provided)
            const initialSize = data.action?.size ?? 48;
            setSubmittedElements((s) => [...s, { 
                id, 
                actionID: backendActionID, 
                type: type, 
                content: trimmed, 
                submitTime: date.toISOString(), 
                x: left, 
                y: top,
                size: initialSize,
                color: data.action?.color,
            }]);
            
            // Update maxActionID for next submission
            setMaxActionID(backendActionID);

            setInput("");
            if(type == "question") setShowAskModal(false);
            if(type == "comment" ) setShowCommentModal(false)
            setVisible(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelInput = () => {
        setInput("");
        setShowAskModal(false);
        setShowCommentModal(false);
        setShowNoSpaceModal(false);
    };

    if (isLoading) {
        return (
            <div className="session-page" ref={containerRef}>
                <main className="content">
                    <h1>Loading session...</h1>
                </main>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="session-page" ref={containerRef}>
                <main className="content">
                    <h1>Error</h1>
                    <p>{loadError}</p>
                </main>
            </div>
        );
    }

    return (
        <div className="session-page" ref={containerRef}>

            {visible && (<main aria-label="initial text" className="content">
                <h1>{sessionData?.title || "Welcome to the Session!"}</h1>
                <p>{sessionData?.description || "It's pretty quiet in here...press the \"+\" button in the bottom right to get started!"}</p>
            </main>)}

            <div
                className="fab-container"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        // Check if there's space before opening options
                        if (!checkSpaceAvailable()) {
                            setOpen(false);
                            setShowNoSpaceModal(true);
                        } else {
                            setOpen((s) => !s);
                        }
                    }
                }}
            >
                <div className={`fab-options ${open ? "show" : ""}`}>
                    <button
                        className="fab-option"
                        onClick={() => {
                            setOpen(false);
                            setShowAskModal(true);
                        }}
                    >
                        <span className="label">Ask</span>
                        <span className="circle small">?</span>
                    </button>

                    <button
                        className="fab-option"
                        onClick={() => {
                            setOpen(false);
                            setShowCommentModal(true);
                        }}
                    >
                        <span className="label">Comment</span>
                        <span className="circle small">✎</span>
                    </button>
                </div>

                <button
                    className={`fab-main ${open ? "active" : ""}`}
                    aria-expanded={open}
                    aria-label="Open actions"
                    onClick={() => {
                        // Check if there's space before opening options
                        if (!checkSpaceAvailable()) {
                            setOpen(false);
                            setShowNoSpaceModal(true);
                        } else {
                            setOpen((s) => !s);
                        }
                    }}
                >
                    <span className="plus">+</span>
                </button>
            </div>

            {/* Generated fabs appended for each submitted question */}
            <div className="generated-fabs" aria-live="polite">
                {submittedElements.map((f) => {
                    const maxSize = 150;
                    const isMaxSize = f.size != null && f.size >= maxSize;
                    return (
                        <button
                            key={f.id}
                            className={`fab-element ${isMaxSize ? 'pulse' : ''}`}
                            title={`${f.content}`}
                            aria-label={`submitted-${f.type}-${f.actionID}`}
                            style={{ 
                                left: f.x != null ? `${f.x}px` : undefined, 
                                top: f.y != null ? `${f.y}px` : undefined,
                                width: f.size != null ? `${f.size}px` : undefined,
                                height: f.size != null ? `${f.size}px` : undefined,
                                backgroundColor: f.color || undefined,
                            }}
                            id={String(f.actionID)}
                        >
                            {f.type == "question" ? <span className="circle small">?</span> : <span className="circle small">🗩</span>}
                        </button>
                    );
                })}
            </div>
                <div
                    className= {`modal-overlay ${showAskModal ? "visible" : ""}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ask a question dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelInput();
                    }}
                >
                    <div className={`modal ${showAskModal ? "visible": ""} `}>
                        <h2>Ask a Question</h2>
                        <label htmlFor="question-input" className="visually-hidden">Type your question</label>
                        <textarea
                            id="question-input"
                            className="input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question here..."
                            rows={6}

                        />

                        <div className="modal-buttons">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {submitElement("question")}}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={cancelInput}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>    

                <div
                    className= {`modal-overlay ${showCommentModal ? "visible" : ""}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Leave a comment dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelInput();
                    }}
                >

                    <div className={`modal ${showCommentModal ? "visible": ""}`}>
                        <h2>Leave a Comment</h2>
                        <label htmlFor="comment-input" className="visually-hidden">Type your comment</label>
                        <textarea
                            id="comment-input"
                            className="input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your comment here..."
                            rows={6}

                        />

                        <div className="modal-buttons">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {submitElement("comment")}}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={cancelInput}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                </div>

                {/* Modal for when there's no space on the board */}
                <div
                    className={`modal-overlay ${showNoSpaceModal ? "visible" : ""}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="No space available dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setShowNoSpaceModal(false);
                    }}
                >
                    <div className={`modal ${showNoSpaceModal ? "visible" : ""}`}>
                        <h2>Oh no! The session board is full. </h2>
                        <p>There's no space to add more questions or comments.</p>
                        <p>Let's wait for the Host to answer some questions to make room for new submissions.</p>
                        <div className="modal-buttons">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => setShowNoSpaceModal(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
                
        
        </div>
    );
}
export default SessionPage;