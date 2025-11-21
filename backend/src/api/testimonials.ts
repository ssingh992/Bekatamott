
import express from 'express';
import { prisma } from '../db';
import { Prisma, testimonial, testimonial_visibility } from '@prisma/client';

const router = express.Router();

const shapeTestimonialForFrontend = (testimonial: testimonial): any => ({
    ...testimonial,
    linkPath: `/testimonials#testimonial-${testimonial.id}`, // Example, frontend might not have a dedicated page
    submittedAt: new Date(testimonial.submittedAt).toISOString(),
    createdAt: testimonial.createdAt ? new Date(testimonial.createdAt).toISOString() : null,
    updatedAt: testimonial.updatedAt ? new Date(testimonial.updatedAt).toISOString() : null,
    mediaUrls: testimonial.mediaUrls || [],
});

// GET all testimonials
router.get('/', async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            orderBy: { submittedAt: 'desc' },
        });
        res.json(testimonials.map(shapeTestimonialForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch testimonials" });
    }
});

// POST a new testimonial
router.post('/', async (req, res) => {
    const { title, contentText, visibility, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, postedByOwnerId, postedByOwnerName, userId, userName, userProfileImageUrl } = req.body;

    try {
        const newTestimonial = await prisma.testimonial.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                title,
                contentText,
                visibility: visibility as testimonial_visibility,
                mediaUrls: mediaUrls || undefined,
                location,
                taggedFriends,
                feelingActivity,
                backgroundTheme,
                postedByOwnerId,
                postedByOwnerName,
                userId,
                userName,
                userProfileImageUrl,
            }
        });
        res.status(201).json(shapeTestimonialForFrontend(newTestimonial));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});

// PUT (update) a testimonial - Optional, as users typically don't edit them
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, contentText, visibility } = req.body;
    
    try {
        const updatedTestimonial = await prisma.testimonial.update({
            where: { id },
            data: {
                title,
                contentText,
                visibility: visibility as testimonial_visibility,
                updatedAt: new Date(),
            }
        });
        res.json(shapeTestimonialForFrontend(updatedTestimonial));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});

// DELETE a testimonial
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.testimonial.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

export default router;
