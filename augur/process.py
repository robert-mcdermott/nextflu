import time, os
import virus_ingest, virus_filter, virus_align, virus_clean
import tree_infer, tree_clean, tree_streamline

def main():
	"""Run full pipeline"""
	
	print "--- Start processing at " + time.strftime("%H:%M:%S") + " ---"	
    
	virus_filter.main()			# Filter sequences
	virus_align.main()			# Align sequences
	virus_clean.main()			# Clean sequences	
	tree_infer.main()			# Make tree
	tree_clean.main()			# Clean tree	
	tree_streamline.main()		# Streamline tree

if __name__ == "__main__":
    main()
