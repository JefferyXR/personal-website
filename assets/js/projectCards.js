(function () {
	if (!document.body.classList.contains('home')) {
		return;
	}

	var cards = Array.prototype.slice.call(document.querySelectorAll('#main > .posts > article'));
	if (!cards.length) {
		return;
	}

	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
	var ticking = false;

	function setActiveCard(activeCard) {
		cards.forEach(function (card) {
			if (card === activeCard) {
				card.classList.add('is-active');
			} else {
				card.classList.remove('is-active');
			}
		});
	}

	function updateActiveCard() {
		if (finePointer.matches) {
			setActiveCard(null);
			return;
		}

		var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
		var bestCard = null;
		var bestOccupancy = 0;

		cards.forEach(function (card) {
			var rect = card.getBoundingClientRect();
			var visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
			var occupancy = visibleHeight / viewportHeight;

			if (occupancy > bestOccupancy) {
				bestOccupancy = occupancy;
				bestCard = card;
			}
		});

		if (bestOccupancy < 0.5) {
			bestCard = null;
		}

		setActiveCard(bestCard);
	}

	function onScrollOrResize() {
		if (ticking) {
			return;
		}

		ticking = true;
		window.requestAnimationFrame(function () {
			updateActiveCard();
			ticking = false;
		});
	}

	window.addEventListener('scroll', onScrollOrResize, { passive: true });
	window.addEventListener('resize', onScrollOrResize);

	if (typeof finePointer.addEventListener === 'function') {
		finePointer.addEventListener('change', updateActiveCard);
	} else if (typeof finePointer.addListener === 'function') {
		finePointer.addListener(updateActiveCard);
	}

	updateActiveCard();
})();
