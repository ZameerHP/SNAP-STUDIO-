'use client'

import { useEffect, RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSmoothScroll } from '@/components/smooth-scroll-provider'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function useAnimations(containerRef: RefObject<HTMLElement | null>) {
  const { lenis } = useSmoothScroll()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // Reveal everything immediately if reduced motion is preferred
      const allHidden = container.querySelectorAll('.anim-hidden, .hero-copy h1, .photo-one, .photo-two, .viewfinder span')
      allHidden.forEach((el) => {
        ;(el as HTMLElement).style.opacity = '1'
        ;(el as HTMLElement).style.transform = 'none'
      })
      return
    }

    const ctx = gsap.context(() => {
      // -------------------------------------------------------------
      // 1. SCROLL PROGRESS INDICATOR
      // -------------------------------------------------------------
      const progressBar = container.querySelector('.scroll-progress-bar')
      if (progressBar) {
        gsap.to(progressBar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.15,
          },
        })
      }

      // -------------------------------------------------------------
      // 2. HERO ENTRANCE SEQUENCE
      // -------------------------------------------------------------
      const heroTimeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      // 1. Top meta row
      const heroMeta = container.querySelector('.hero-meta')
      if (heroMeta) {
        heroTimeline.fromTo(
          heroMeta,
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }
        )
      }

      // 2. Corner brackets draw in (scale + opacity)
      const cornerBrackets = container.querySelectorAll('.viewfinder span')
      if (cornerBrackets.length > 0) {
        heroTimeline.fromTo(
          cornerBrackets,
          { opacity: 0, scale: 0.3 },
          { opacity: 0.8, scale: 1, duration: 0.7, stagger: 0.08 },
          '-=0.4'
        )
      }

      // 3. Eyebrow badge row
      const heroBadgeRow = container.querySelector('.hero-badge-row')
      if (heroBadgeRow) {
        heroTimeline.fromTo(
          heroBadgeRow,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
      }

      // 4. "SUPER" then "SNAP" slide up from below
      const heroTitleWords = container.querySelectorAll('.hero h1 .word-line')
      if (heroTitleWords.length > 0) {
        heroTimeline.fromTo(
          heroTitleWords,
          { opacity: 0, y: 45 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.15, ease: 'power3.out' },
          '-=0.4'
        )
      } else {
        const heroTitle = container.querySelector('#hero-title')
        if (heroTitle) {
          heroTimeline.fromTo(
            heroTitle,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' },
            '-=0.4'
          )
        }
      }

      // 5. The two photo cards: fade + scale in with rotation settle
      const photoOne = container.querySelector('.photo-one')
      const photoTwo = container.querySelector('.photo-two')

      if (photoOne) {
        heroTimeline.fromTo(
          photoOne,
          { opacity: 0, scale: 0.9, rotate: 0 },
          { opacity: 1, scale: 1, rotate: 3, duration: 1.0, ease: 'power3.out' },
          '-=0.6'
        )
      }

      if (photoTwo) {
        heroTimeline.fromTo(
          photoTwo,
          { opacity: 0, scale: 0.9, rotate: 0 },
          { opacity: 1, scale: 1, rotate: -4, duration: 1.0, ease: 'power3.out' },
          '-=0.85'
        )
      }

      // 6. Tagline & Metrics strip
      const heroNote = container.querySelector('.hero-note')
      const heroMetrics = container.querySelector('.hero-metrics-strip')
      if (heroNote) {
        heroTimeline.fromTo(
          heroNote,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.6'
        )
      }
      if (heroMetrics) {
        heroTimeline.fromTo(
          heroMetrics,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        )
      }

      // 7. Scroll cue
      const scrollCue = container.querySelector('.scroll-cue')
      if (scrollCue) {
        heroTimeline.fromTo(
          scrollCue,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
      }

      // -------------------------------------------------------------
      // 3. HERO IDLE MOTION & PARALLAX
      // -------------------------------------------------------------
      heroTimeline.add(() => {
        if (photoOne) {
          gsap.to(photoOne, {
            y: '+=4px',
            duration: 3.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }
        if (photoTwo) {
          gsap.to(photoTwo, {
            y: '-=4px',
            duration: 3.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }
      })

      // Parallax on scroll for hero photos
      const heroSection = container.querySelector('.hero')
      if (heroSection && photoOne && photoTwo) {
        gsap.to(photoOne, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.4,
          },
        })

        gsap.to(photoTwo, {
          y: -70,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.4,
          },
        })
      }

      // -------------------------------------------------------------
      // 4. SCROLL-TRIGGERED SECTION REVEALS
      // -------------------------------------------------------------
      const sections = container.querySelectorAll('section:not(.hero)')

      sections.forEach((section) => {
        // Section Eyebrows & Index Numbers
        const sectionIndex = section.querySelector('.section-index, .eyebrow')
        if (sectionIndex) {
          gsap.fromTo(
            sectionIndex,
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.9,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                once: true,
              },
            }
          )
        }

        // Big Headline Text (per line/word slide-up)
        const headingLines = section.querySelectorAll('h2 .word-line')
        if (headingLines.length > 0) {
          gsap.fromTo(
            headingLines,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 1.05,
              stagger: 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                once: true,
              },
            }
          )
        }

        // Paragraphs & Leads
        const paragraphs = section.querySelectorAll('.intro-text p, .lead, .services-heading p, .process-header p, .portal-section p, .contact-copy > p, .section-subtext')
        if (paragraphs.length > 0) {
          gsap.fromTo(
            paragraphs,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.95,
              stagger: 0.1,
              delay: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                once: true,
              },
            }
          )
        }
      })

      // -------------------------------------------------------------
      // 5. PILLAR CARDS (THE APPROACH)
      // -------------------------------------------------------------
      const pillarCards = container.querySelectorAll('.pillar-card')
      if (pillarCards.length > 0) {
        gsap.fromTo(
          pillarCards,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.pillars-grid',
              start: 'top 82%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 6. GALLERY / SELECTED WORK SECTION
      // -------------------------------------------------------------
      const workCards = container.querySelectorAll('.work-card')
      if (workCards.length > 0) {
        gsap.fromTo(
          workCards,
          { opacity: 0, scale: 0.96, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.1,
            stagger: 0.14,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.work-section',
              start: 'top 78%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 7. SERVICES & PACKAGES
      // -------------------------------------------------------------
      const serviceCards = container.querySelectorAll('.service-package-card, .starting-rate-card, .category-card')
      if (serviceCards.length > 0) {
        gsap.fromTo(
          serviceCards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.05,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.services-section',
              start: 'top 78%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 8. GEAR VAULT & FACILITY
      // -------------------------------------------------------------
      const facilityInfo = container.querySelector('.facility-info')
      const gearCard = container.querySelector('.gear-vault-card')
      if (facilityInfo && gearCard) {
        gsap.fromTo(
          [facilityInfo, gearCard],
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.1,
            stagger: 0.18,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.gear-section',
              start: 'top 78%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 9. STATEMENT SECTION PARALLAX
      // -------------------------------------------------------------
      const statementImage = container.querySelector('.statement-image img')
      const statementSection = container.querySelector('.statement-section')
      if (statementImage && statementSection) {
        gsap.to(statementImage, {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: statementSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
      }

      // -------------------------------------------------------------
      // 10. PROCESS SECTION (FROM CONCEPT TO MASTER)
      // -------------------------------------------------------------
      const processSteps = container.querySelectorAll('.process-step')
      const connectingLine = container.querySelector('.process-connecting-line')

      if (connectingLine) {
        gsap.fromTo(
          connectingLine,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.process-section',
              start: 'top 65%',
              end: 'bottom 80%',
              scrub: 0.8,
            },
          }
        )
      }

      if (processSteps.length > 0) {
        gsap.fromTo(
          processSteps,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            stagger: 0.14,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.process-section',
              start: 'top 72%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 11. CLIENT PORTAL SECTION
      // -------------------------------------------------------------
      const portalCard = container.querySelector('.portal-card')
      if (portalCard) {
        gsap.fromTo(
          portalCard,
          { opacity: 0, scale: 0.94, rotate: 0, y: 25 },
          {
            opacity: 1,
            scale: 1,
            rotate: 2.5,
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.portal-section',
              start: 'top 72%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 12. CLIENT REVIEWS & STANDARDS SECTION
      // -------------------------------------------------------------
      const reviewCards = container.querySelectorAll('.review-card')
      if (reviewCards.length > 0) {
        gsap.fromTo(
          reviewCards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.05,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.reviews-section',
              start: 'top 78%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 13. FAQ SECTION
      // -------------------------------------------------------------
      const faqItems = container.querySelectorAll('.faq-item')
      if (faqItems.length > 0) {
        gsap.fromTo(
          faqItems,
          { opacity: 0, x: -15 },
          {
            opacity: 1,
            x: 0,
            duration: 0.85,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.faq-section',
              start: 'top 78%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 14. CONTACT / BOOKING SECTION
      // -------------------------------------------------------------
      const contactCopy = container.querySelector('.contact-copy')
      const contactForm = container.querySelector('.contact-form')
      if (contactCopy && contactForm) {
        gsap.fromTo(
          [contactCopy, contactForm],
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.1,
            stagger: 0.18,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.contact-section',
              start: 'top 72%',
              once: true,
            },
          }
        )
      }

      // -------------------------------------------------------------
      // 15. SECTION COUNTER UPDATE
      // -------------------------------------------------------------
      const counterEl = container.querySelector('.hero-counter')
      const totalSections = container.querySelectorAll('section').length
      if (counterEl) {
        container.querySelectorAll('section').forEach((sec, idx) => {
          ScrollTrigger.create({
            trigger: sec,
            start: 'top 50%',
            end: 'bottom 50%',
            onEnter: () => {
              counterEl.textContent = `00${idx + 1} — 00${totalSections}`
            },
            onEnterBack: () => {
              counterEl.textContent = `00${idx + 1} — 00${totalSections}`
            },
          })
        })
      }
    }, container)

    return () => {
      ctx.revert()
    }
  }, [containerRef, lenis])
}
